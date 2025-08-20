import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-change-in-production")

const rateLimitMap = new Map<string, { count: number; lastReset: number }>()

function rateLimit(ip: string, limit = 100, windowMs: number = 15 * 60 * 1000): boolean {
  const now = Date.now()
  const windowStart = now - windowMs

  const record = rateLimitMap.get(ip)
  if (!record || record.lastReset < windowStart) {
    rateLimitMap.set(ip, { count: 1, lastReset: now })
    return true
  }

  if (record.count >= limit) {
    return false
  }

  record.count++
  return true
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("X-XSS-Protection", "1; mode=block")

  if (request.nextUrl.pathname.startsWith("/api/")) {
    const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown"

    if (!rateLimit(ip)) {
      return new NextResponse("Too Many Requests", { status: 429 })
    }
  }

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const token = request.cookies.get("admin-token")?.value

    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    try {
      await jwtVerify(token, secret)
      return response
    } catch (error) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  return response
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
}
