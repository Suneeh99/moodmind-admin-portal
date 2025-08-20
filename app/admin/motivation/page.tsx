"use client"

import { useState, useEffect } from "react"
import { collection, query, orderBy, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { MotivationReel } from "@/lib/firestore-hooks"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Play, User, Calendar, Info } from "lucide-react"
import { format } from "date-fns"

export default function MotivationPage() {
  const [reels, setReels] = useState<MotivationReel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReels = async () => {
      try {
        setLoading(true)
        const q = query(collection(db, "motivation_reels"), orderBy("createdAt", "desc"))
        const snapshot = await getDocs(q)
        const reelsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as MotivationReel[]

        setReels(reelsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch motivation reels")
      } finally {
        setLoading(false)
      }
    }

    fetchReels()
  }, [])

  if (loading) return <div>Loading motivation reels...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Motivation Lounge</h1>
        <p className="text-muted-foreground">Motivational content and reels (read-only)</p>
      </div>

      {/* Admin Policy Notice */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Admin has no actions in Motivation Lounge per policy.</strong> This section is read-only for
          monitoring purposes only.
        </AlertDescription>
      </Alert>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reels</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reels.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Reels</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reels.filter((reel) => reel.active).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Authors</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(reels.map((reel) => reel.author)).size}</div>
          </CardContent>
        </Card>
      </div>

      {/* Reels Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reels.map((reel) => (
          <Card key={reel.id} className="overflow-hidden">
            <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative">
              {reel.thumbnailUrl ? (
                <img
                  src={reel.thumbnailUrl || "/placeholder.svg"}
                  alt={reel.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Play className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <div className="absolute top-2 right-2">
                <Badge variant={reel.active ? "default" : "secondary"}>{reel.active ? "Active" : "Inactive"}</Badge>
              </div>
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-base line-clamp-2">{reel.title}</CardTitle>
              <CardDescription className="flex items-center space-x-4 text-xs">
                <span className="flex items-center">
                  <User className="mr-1 h-3 w-3" />
                  {reel.author}
                </span>
                <span className="flex items-center">
                  <Calendar className="mr-1 h-3 w-3" />
                  {format(reel.createdAt.toDate(), "MMM dd, yyyy")}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Source: {reel.source}</span>
                {reel.videoUrl && (
                  <a
                    href={reel.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View Video
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {reels.length === 0 && (
        <div className="text-center py-12">
          <Play className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">No motivation reels</h3>
          <p className="mt-1 text-sm text-muted-foreground">No motivational content has been added yet.</p>
        </div>
      )}
    </div>
  )
}
