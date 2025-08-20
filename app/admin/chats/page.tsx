"use client"

import { useState, useEffect } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { collection, query, orderBy, getDocs, type Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useUsers, type Chat } from "@/lib/firestore-hooks"
import { DataTable } from "@/components/ui/data-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MessageSquare, Users, Shield, Lock } from "lucide-react"
import { format } from "date-fns"

export default function ChatsPage() {
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { users } = useUsers({ pageSize: 1000 })

  // Create user lookup map
  const userMap = users.reduce(
    (acc, user) => {
      acc[user.id] = user.displayName || user.email
      return acc
    },
    {} as Record<string, string>,
  )

  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoading(true)
        // Only fetch chat metadata, never subcollection messages
        const q = query(collection(db, "chats"), orderBy("createdAt", "desc"))
        const snapshot = await getDocs(q)
        const chatsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          consultantId: doc.data().consultantId,
          participants: doc.data().participants || [],
          createdAt: doc.data().createdAt,
          lastMessage: doc.data().lastMessage,
          lastMessageTime: doc.data().lastMessageTime,
          lastSenderId: doc.data().lastSenderId,
          lastMessageSeenBy: doc.data().lastMessageSeenBy || [],
          consultantSeen: doc.data().consultantSeen,
        })) as Chat[]

        setChats(chatsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch chats")
      } finally {
        setLoading(false)
      }
    }

    fetchChats()
  }, [])

  const columns: ColumnDef<Chat>[] = [
    {
      accessorKey: "id",
      header: "Conversation ID",
      cell: ({ row }) => {
        const id = row.getValue("id") as string
        return <span className="font-mono text-sm">{id.slice(0, 12)}...</span>
      },
    },
    {
      accessorKey: "consultantId",
      header: "Consultant",
      cell: ({ row }) => {
        const consultantId = row.getValue("consultantId") as string
        const consultantName = userMap[consultantId] || "Unknown Consultant"
        return (
          <div>
            <div className="font-medium">{consultantName}</div>
            <div className="text-xs text-muted-foreground font-mono">{consultantId.slice(0, 8)}...</div>
          </div>
        )
      },
    },
    {
      accessorKey: "participants",
      header: "Participants",
      cell: ({ row }) => {
        const participants = row.getValue("participants") as string[]
        return (
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{participants.length}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: "Started",
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as Timestamp
        return format(date.toDate(), "MMM dd, yyyy HH:mm")
      },
    },
    {
      accessorKey: "lastMessageTime",
      header: "Last Activity",
      cell: ({ row }) => {
        const date = row.getValue("lastMessageTime") as Timestamp
        if (!date) return <span className="text-muted-foreground">No activity</span>
        return format(date.toDate(), "MMM dd, yyyy HH:mm")
      },
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const chat = row.original
        const isActive =
          chat.lastMessageTime && new Date().getTime() - chat.lastMessageTime.toDate().getTime() < 24 * 60 * 60 * 1000
        return <Badge variant={isActive ? "default" : "secondary"}>{isActive ? "Active" : "Inactive"}</Badge>
      },
    },
  ]

  if (loading) return <div>Loading chats...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Chat Management</h1>
        <p className="text-muted-foreground">Monitor chat conversations (metadata only)</p>
      </div>

      {/* Privacy Banner */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Privacy-first:</strong> Admin cannot view message content or diary text. Only metadata and sentiment
          analytics are available.
        </AlertDescription>
      </Alert>

      {/* Encryption Notice */}
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertDescription>
          <strong>Message content is end-to-end encrypted.</strong> Admin cannot view chats between users and
          consultants. Only conversation metadata is available for monitoring purposes.
        </AlertDescription>
      </Alert>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chats.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Today</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                chats.filter(
                  (chat) =>
                    chat.lastMessageTime &&
                    new Date().getTime() - chat.lastMessageTime.toDate().getTime() < 24 * 60 * 60 * 1000,
                ).length
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Consultants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(chats.map((chat) => chat.consultantId)).size}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {chats.reduce((total, chat) => total + chat.participants.length, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chats Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Chat Conversations
          </CardTitle>
          <CardDescription>Conversation metadata and activity overview</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={chats} searchKey="id" searchPlaceholder="Search conversations..." />
        </CardContent>
      </Card>
    </div>
  )
}
