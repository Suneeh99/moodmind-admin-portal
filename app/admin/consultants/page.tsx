"use client"

import { useState, useEffect } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { collection, query, getDocs, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useUsers, useDiaryInsights, type User, type Chat } from "@/lib/firestore-hooks"
import { DataTable } from "@/components/ui/data-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { UserCheck, MessageSquare, TrendingUp, Eye } from "lucide-react"
import { format } from "date-fns"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export default function ConsultantsPage() {
  const { users: allUsers } = useUsers({ pageSize: 1000 })
  const { entries } = useDiaryInsights()
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedConsultant, setSelectedConsultant] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Filter verified consultants
  const consultants = allUsers.filter((user) => user.role === "consultant" && user.verified)

  useEffect(() => {
    const fetchChats = async () => {
      try {
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
      } catch (error) {
        console.error("Failed to fetch chats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchChats()
  }, [])

  // Calculate consultant analytics
  const getConsultantAnalytics = (consultantId: string) => {
    const consultantChats = chats.filter((chat) => chat.consultantId === consultantId)
    const casesHandled = consultantChats.length

    // Get users who have chatted with this consultant
    const consultantUsers = new Set<string>()
    consultantChats.forEach((chat) => {
      chat.participants.forEach((userId) => {
        if (userId !== consultantId) {
          consultantUsers.add(userId)
        }
      })
    })

    // Get sentiment data for users who have chatted with this consultant
    const userSentimentData = entries.filter((entry) => consultantUsers.has(entry.userId))

    return {
      casesHandled,
      uniqueUsers: consultantUsers.size,
      sentimentData: userSentimentData,
    }
  }

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "displayName",
      header: "Consultant",
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName}`} />
              <AvatarFallback>{user.displayName?.charAt(0) || "C"}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{user.displayName}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: "Verified Since",
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as any
        return format(date.toDate(), "MMM dd, yyyy")
      },
    },
    {
      id: "casesHandled",
      header: "Cases Handled",
      cell: ({ row }) => {
        const user = row.original
        const analytics = getConsultantAnalytics(user.id)
        return (
          <div className="flex items-center space-x-1">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span>{analytics.casesHandled}</span>
          </div>
        )
      },
    },
    {
      id: "uniqueUsers",
      header: "Unique Users",
      cell: ({ row }) => {
        const user = row.original
        const analytics = getConsultantAnalytics(user.id)
        return analytics.uniqueUsers
      },
    },
    {
      id: "status",
      header: "Status",
      cell: () => <Badge variant="default">Active</Badge>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const user = row.original
        return (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" onClick={() => setSelectedConsultant(user)}>
                <Eye className="mr-1 h-3 w-3" />
                View Analytics
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[600px] sm:w-[700px]">
              <ConsultantAnalytics consultant={user} analytics={getConsultantAnalytics(user.id)} />
            </SheetContent>
          </Sheet>
        )
      },
    },
  ]

  if (loading) return <div>Loading consultants...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Verified Consultants</h1>
        <p className="text-muted-foreground">Manage active consultants and view their analytics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Consultants</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consultants.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chats.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Cases per Consultant</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {consultants.length > 0 ? Math.round(chats.length / consultants.length) : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Consultants Table */}
      <DataTable
        columns={columns}
        data={consultants}
        searchKey="displayName"
        searchPlaceholder="Search consultants..."
      />
    </div>
  )
}

function ConsultantAnalytics({
  consultant,
  analytics,
}: {
  consultant: User
  analytics: { casesHandled: number; uniqueUsers: number; sentimentData: any[] }
}) {
  // Process sentiment trend for this consultant's users
  const sentimentTrend = analytics.sentimentData
    .reduce((acc, entry) => {
      const date = format(entry.createdAt.toDate(), "yyyy-MM-dd")
      const existing = acc.find((item) => item.date === date)

      if (existing) {
        existing.joy += entry.sentimentAnalysis.joy
        existing.anger += entry.sentimentAnalysis.anger
        existing.fear += entry.sentimentAnalysis.fear
        existing.count += 1
      } else {
        acc.push({
          date,
          joy: entry.sentimentAnalysis.joy,
          anger: entry.sentimentAnalysis.anger,
          fear: entry.sentimentAnalysis.fear,
          count: 1,
        })
      }
      return acc
    }, [] as any[])
    .map((item) => ({
      date: item.date,
      joy: item.joy / item.count,
      anger: item.anger / item.count,
      fear: item.fear / item.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${consultant.displayName}`} />
            <AvatarFallback>{consultant.displayName?.charAt(0) || "C"}</AvatarFallback>
          </Avatar>
          <div>
            <div>{consultant.displayName}</div>
            <div className="text-sm text-muted-foreground">{consultant.email}</div>
          </div>
        </SheetTitle>
        <SheetDescription>Consultant performance and user sentiment analytics</SheetDescription>
      </SheetHeader>

      <div className="mt-6 space-y-6">
        {/* Performance Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Cases Handled</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.casesHandled}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Unique Users Helped</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.uniqueUsers}</div>
            </CardContent>
          </Card>
        </div>

        {/* Sentiment Trend Chart */}
        {sentimentTrend.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>User Sentiment Trend</CardTitle>
              <CardDescription>Average sentiment of users consulting with this consultant</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={sentimentTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="joy" stroke="#10b981" name="Joy" />
                  <Line type="monotone" dataKey="fear" stroke="#f59e0b" name="Fear" />
                  <Line type="monotone" dataKey="anger" stroke="#ef4444" name="Anger" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Privacy Notice */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Privacy Notice</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This analytics data is derived from aggregated sentiment analysis of diary entries. No personal content or
              chat messages are accessed or displayed.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
