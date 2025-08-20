"use client"

import { useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useTasks, useUsers, type Task } from "@/lib/firestore-hooks"
import { DataTable } from "@/components/ui/data-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CSVExport } from "@/components/csv-export"
import { CheckSquare, Award, TrendingUp, ImageIcon } from "lucide-react"
import { format } from "date-fns"

export default function TasksPage() {
  const [timeWindow, setTimeWindow] = useState<"24h" | "7d" | "30d">("7d")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [verificationFilter, setVerificationFilter] = useState<string>("all")

  const { tasks, loading, error } = useTasks(timeWindow)
  const { users } = useUsers({ pageSize: 1000 })

  // Create user lookup map
  const userMap = users.reduce(
    (acc, user) => {
      acc[user.id] = user.displayName || user.email
      return acc
    },
    {} as Record<string, string>,
  )

  // Filter tasks based on selected filters
  const filteredTasks = tasks.filter((task) => {
    if (statusFilter !== "all" && task.status !== statusFilter) return false
    if (verificationFilter === "required" && !task.requiresVerification) return false
    if (verificationFilter === "not-required" && task.requiresVerification) return false
    return true
  })

  // Calculate summary statistics
  const totalTasks = filteredTasks.length
  const completedTasks = filteredTasks.filter((t) => t.status === "completed" || t.status === "verified").length
  const verifiedTasks = filteredTasks.filter((t) => t.status === "verified").length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const totalPoints = filteredTasks.reduce((sum, task) => sum + (task.pointsAwarded || 0), 0)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default"
      case "verified":
        return "default"
      case "pending":
        return "secondary"
      default:
        return "outline"
    }
  }

  const columns: ColumnDef<Task>[] = [
    {
      accessorKey: "userId",
      header: "User",
      cell: ({ row }) => {
        const userId = row.getValue("userId") as string
        const userName = userMap[userId] || "Unknown User"
        return (
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${userName}`} />
              <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{userName}</div>
              <div className="text-xs text-muted-foreground font-mono">{userId.slice(0, 8)}...</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "title",
      header: "Task",
      cell: ({ row }) => {
        const task = row.original
        return (
          <div>
            <div className="font-medium">{task.title}</div>
            <div className="text-sm text-muted-foreground">
              {format(task.date.toDate(), "MMM dd, yyyy")} at {task.timeHour.toString().padStart(2, "0")}:
              {task.timeMinute.toString().padStart(2, "0")}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return <Badge variant={getStatusColor(status)}>{status}</Badge>
      },
    },
    {
      accessorKey: "pointsAwarded",
      header: "Points",
      cell: ({ row }) => {
        const points = row.getValue("pointsAwarded") as number
        return (
          <div className="flex items-center space-x-1">
            <Award className="h-4 w-4 text-yellow-500" />
            <span className="font-medium">{points}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "requiresVerification",
      header: "Verification",
      cell: ({ row }) => {
        const task = row.original
        return (
          <div className="flex items-center space-x-2">
            {task.requiresVerification ? (
              <>
                <Badge variant="outline">Required</Badge>
                {task.verificationPhotoUrl && (
                  <a
                    href={task.verificationPhotoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </a>
                )}
              </>
            ) : (
              <Badge variant="secondary">Not Required</Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as any
        return format(date.toDate(), "MMM dd, HH:mm")
      },
    },
    {
      accessorKey: "completedAt",
      header: "Completed",
      cell: ({ row }) => {
        const date = row.getValue("completedAt") as any
        return date ? format(date.toDate(), "MMM dd, HH:mm") : <span className="text-muted-foreground">-</span>
      },
    },
  ]

  if (loading) return <div>Loading tasks...</div>
  if (error) return <div>Error: {error}</div>

  const csvColumns = [
    { key: "id", label: "Task ID" },
    { key: "userId", label: "User ID" },
    { key: "title", label: "Title" },
    { key: "status", label: "Status" },
    { key: "pointsAwarded", label: "Points Awarded" },
    { key: "requiresVerification", label: "Requires Verification" },
    { key: "date", label: "Task Date" },
    { key: "createdAt", label: "Created At" },
    { key: "completedAt", label: "Completed At" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Task Management</h1>
          <p className="text-muted-foreground">Monitor user tasks and completion rates</p>
        </div>
        <CSVExport data={filteredTasks} filename={`tasks-${timeWindow}`} columns={csvColumns} />
      </div>

      {/* Time Window Tabs */}
      <Tabs value={timeWindow} onValueChange={(value) => setTimeWindow(value as "24h" | "7d" | "30d")}>
        <TabsList>
          <TabsTrigger value="24h">Last 24 Hours</TabsTrigger>
          <TabsTrigger value="7d">Last 7 Days</TabsTrigger>
          <TabsTrigger value="30d">Last 30 Days</TabsTrigger>
        </TabsList>

        <TabsContent value={timeWindow} className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalTasks}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckSquare className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedTasks}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Verified</CardTitle>
                <CheckSquare className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{verifiedTasks}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completionRate}%</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Points</CardTitle>
                <Award className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalPoints}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
              </SelectContent>
            </Select>

            <Select value={verificationFilter} onValueChange={setVerificationFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="required">Requires Verification</SelectItem>
                <SelectItem value="not-required">No Verification</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tasks Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                Tasks ({timeWindow.toUpperCase()})
              </CardTitle>
              <CardDescription>
                Showing {filteredTasks.length} tasks from the{" "}
                {timeWindow === "24h" ? "last 24 hours" : timeWindow === "7d" ? "last 7 days" : "last 30 days"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable columns={columns} data={filteredTasks} searchKey="title" searchPlaceholder="Search tasks..." />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
