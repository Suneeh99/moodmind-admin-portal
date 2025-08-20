"use client"

import { useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useUserPoints, usePointsTransactions, type UserPoints, type PointsTransaction } from "@/lib/firestore-hooks"
import { DataTable } from "@/components/ui/data-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { CSVExport } from "@/components/csv-export"
import { Trophy, Award, TrendingUp, Eye, Calendar } from "lucide-react"
import { format } from "date-fns"

export default function LeaderboardPage() {
  const { userPoints, loading, error } = useUserPoints()
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const getRankBadgeVariant = (rank: number) => {
    if (rank === 1) return "default"
    if (rank <= 3) return "secondary"
    return "outline"
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return "🥇"
    if (rank === 2) return "🥈"
    if (rank === 3) return "🥉"
    return rank.toString()
  }

  const columns: ColumnDef<UserPoints>[] = [
    {
      accessorKey: "rank",
      header: "Rank",
      cell: ({ row }) => {
        const rank = row.getValue("rank") as number
        return (
          <div className="flex items-center space-x-2">
            <Badge variant={getRankBadgeVariant(rank)} className="w-12 justify-center">
              {getRankIcon(rank)}
            </Badge>
          </div>
        )
      },
    },
    {
      accessorKey: "userName",
      header: "User",
      cell: ({ row }) => {
        const userPoints = row.original
        return (
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={
                  userPoints.photoUrl ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${userPoints.userName || "/placeholder.svg"}`
                }
              />
              <AvatarFallback>{userPoints.userName?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{userPoints.userName}</div>
              <div className="text-xs text-muted-foreground font-mono">{userPoints.userId.slice(0, 8)}...</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "totalPoints",
      header: "Total Points",
      cell: ({ row }) => {
        const points = row.getValue("totalPoints") as number
        return (
          <div className="flex items-center space-x-1">
            <Award className="h-4 w-4 text-yellow-500" />
            <span className="font-bold text-lg">{points.toLocaleString()}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "lastUpdated",
      header: "Last Updated",
      cell: ({ row }) => {
        const date = row.getValue("lastUpdated") as any
        return format(date.toDate(), "MMM dd, yyyy")
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const userPoints = row.original
        return (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" onClick={() => setSelectedUserId(userPoints.userId)}>
                <Eye className="mr-1 h-3 w-3" />
                View History
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[500px] sm:w-[600px]">
              <PointsHistory userId={userPoints.userId} userName={userPoints.userName} />
            </SheetContent>
          </Sheet>
        )
      },
    },
  ]

  if (loading) return <div>Loading leaderboard...</div>
  if (error) return <div>Error: {error}</div>

  // Calculate stats
  const totalUsers = userPoints.length
  const totalPoints = userPoints.reduce((sum, user) => sum + user.totalPoints, 0)
  const averagePoints = totalUsers > 0 ? Math.round(totalPoints / totalUsers) : 0
  const topUser = userPoints[0]

  const csvColumns = [
    { key: "rank", label: "Rank" },
    { key: "userId", label: "User ID" },
    { key: "userName", label: "User Name" },
    { key: "totalPoints", label: "Total Points" },
    { key: "lastUpdated", label: "Last Updated" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leaderboard</h1>
          <p className="text-muted-foreground">User rankings and points overview</p>
        </div>
        <CSVExport data={userPoints} filename="leaderboard" columns={csvColumns} />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Award className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPoints.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Points</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averagePoints}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top User</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{topUser?.userName || "N/A"}</div>
            <div className="text-sm text-muted-foreground">{topUser?.totalPoints.toLocaleString() || 0} points</div>
          </CardContent>
        </Card>
      </div>

      {/* Top 3 Podium */}
      {userPoints.length >= 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Top 3 Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-end space-x-8">
              {/* 2nd Place */}
              <div className="text-center">
                <Avatar className="h-16 w-16 mx-auto mb-2">
                  <AvatarImage
                    src={
                      userPoints[1]?.photoUrl ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${userPoints[1]?.userName || "/placeholder.svg"}`
                    }
                  />
                  <AvatarFallback>{userPoints[1]?.userName?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div className="bg-gray-300 h-20 w-24 rounded-t-lg flex items-center justify-center">
                  <span className="text-2xl">🥈</span>
                </div>
                <div className="mt-2">
                  <div className="font-medium">{userPoints[1]?.userName}</div>
                  <div className="text-sm text-muted-foreground">{userPoints[1]?.totalPoints} pts</div>
                </div>
              </div>

              {/* 1st Place */}
              <div className="text-center">
                <Avatar className="h-20 w-20 mx-auto mb-2">
                  <AvatarImage
                    src={
                      userPoints[0]?.photoUrl ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${userPoints[0]?.userName || "/placeholder.svg"}`
                    }
                  />
                  <AvatarFallback>{userPoints[0]?.userName?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div className="bg-yellow-400 h-28 w-24 rounded-t-lg flex items-center justify-center">
                  <span className="text-3xl">🥇</span>
                </div>
                <div className="mt-2">
                  <div className="font-bold text-lg">{userPoints[0]?.userName}</div>
                  <div className="text-sm text-muted-foreground">{userPoints[0]?.totalPoints} pts</div>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="text-center">
                <Avatar className="h-16 w-16 mx-auto mb-2">
                  <AvatarImage
                    src={
                      userPoints[2]?.photoUrl ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${userPoints[2]?.userName || "/placeholder.svg"}`
                    }
                  />
                  <AvatarFallback>{userPoints[2]?.userName?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div className="bg-amber-600 h-16 w-24 rounded-t-lg flex items-center justify-center">
                  <span className="text-2xl">🥉</span>
                </div>
                <div className="mt-2">
                  <div className="font-medium">{userPoints[2]?.userName}</div>
                  <div className="text-sm text-muted-foreground">{userPoints[2]?.totalPoints} pts</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full Leaderboard Table */}
      <Card>
        <CardHeader>
          <CardTitle>Full Leaderboard</CardTitle>
          <CardDescription>Complete ranking of all users by total points</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={userPoints} searchKey="userName" searchPlaceholder="Search users..." />
        </CardContent>
      </Card>
    </div>
  )
}

function PointsHistory({ userId, userName }: { userId: string; userName: string }) {
  const { transactions, loading, error } = usePointsTransactions(userId)

  const columns: ColumnDef<PointsTransaction>[] = [
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as any
        return format(date.toDate(), "MMM dd, yyyy HH:mm")
      },
    },
    {
      accessorKey: "points",
      header: "Points",
      cell: ({ row }) => {
        const transaction = row.original
        const points = transaction.points
        const isPositive = points > 0
        return (
          <div className={`flex items-center space-x-1 ${isPositive ? "text-green-600" : "text-red-600"}`}>
            <span className="font-medium">
              {isPositive ? "+" : ""}
              {points}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("type") as string
        return <Badge variant={type === "earned" ? "default" : "secondary"}>{type}</Badge>
      },
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => {
        const reason = row.getValue("reason") as string
        return <span className="text-sm">{reason}</span>
      },
    },
    {
      accessorKey: "taskId",
      header: "Task",
      cell: ({ row }) => {
        const taskId = row.getValue("taskId") as string
        return taskId ? (
          <span className="font-mono text-xs">{taskId.slice(0, 8)}...</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
    },
  ]

  if (loading) return <div>Loading transaction history...</div>
  if (error) return <div>Error: {error}</div>

  const totalEarned = transactions.filter((t) => t.type === "earned").reduce((sum, t) => sum + t.points, 0)
  const totalAdjusted = transactions.filter((t) => t.type === "adjusted").reduce((sum, t) => sum + t.points, 0)

  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center space-x-2">
          <Award className="h-5 w-5 text-yellow-500" />
          <span>Points History - {userName}</span>
        </SheetTitle>
        <SheetDescription>Complete transaction history for this user</SheetDescription>
      </SheetHeader>

      <div className="mt-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transactions.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Points Earned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">+{totalEarned}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Adjustments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totalAdjusted}</div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <DataTable columns={columns} data={transactions} />
            ) : (
              <div className="text-center py-8">
                <Award className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold">No transactions</h3>
                <p className="mt-1 text-sm text-muted-foreground">This user has no points transactions yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
