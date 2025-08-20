import type React from "react"
import { AdminLayout } from "@/components/admin-layout"
import { requireAdmin } from "@/lib/auth"

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()

  return <AdminLayout>{children}</AdminLayout>
}
