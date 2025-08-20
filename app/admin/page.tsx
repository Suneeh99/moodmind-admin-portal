"use client"
import { Pie } from "recharts"
import { useUsers, useTasks, useDiaryInsights, useEmergencyContacts } from "@/lib/firestore-hooks"
import { StatCard } from "@/components/stat-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, UserCheck, CheckSquare, Heart, TrendingUp, LucidePieChart } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
} from "recharts"

export default function AdminDashboard() {
  const { users } = useUsers({ pageSize: 1000 })
  const { tasks } = useTasks("30d")
  const { entries } = useDiaryInsights()
  const { contacts } = useEmergencyContacts()

  // Calculate stats
  const totalUsers = users.filter((u) => u.role === "user").length
  const totalConsultants = users.filter((u) => u.role === "consultant" && u.verified).length
  const pendingRequests = users.filter((u) => u.role === "consultant" && !u.verified).length
  const totalTasks = tasks.length
  const sosContacts = contacts.length

  // Task status breakdown
  const taskStats = {
    pending: tasks.filter((t) => t.status === "pending").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    verified: tasks.filter((t) => t.status === "verified").length,
  }

  // Sentiment trend data (mock for now - would aggregate from diary entries)
  const sentimentTrend = [
    { date: "2025-01-01", joy: 0.6, anger: 0.2, fear: 0.2 },
    { date: "2025-01-02", joy: 0.65, anger: 0.18, fear: 0.17 },
    { date: "2025-01-03", joy: 0.7, anger: 0.15, fear: 0.15 },
    { date: "2025-01-04", joy: 0.68, anger: 0.16, fear: 0.16 },
    { date: "2025-01-05", joy: 0.72, anger: 0.14, fear: 0.14 },
  ]

  const pieData = [
    { name: "Pending", value: taskStats.pending, color: "#f59e0b" },
    { name: "Completed", value: taskStats.completed, color: "#10b981" },
    { name: "Verified", value: taskStats.verified, color: "#3b82f6" },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Total Users" value={totalUsers} icon={Users} description="Active users" />
        <StatCard title="Consultants" value={totalConsultants} icon={UserCheck} description="Verified consultants" />
        <StatCard title="Pending Requests" value={pendingRequests} icon={UserCheck} description="Awaiting approval" />
        <StatCard title="Tasks (30d)" value={totalTasks} icon={CheckSquare} description="Last 30 days" />
        <StatCard title="SOS Contacts" value={sosContacts} icon={Heart} description="Emergency contacts" />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Mood Sentiment Trend
            </CardTitle>
            <CardDescription>Average sentiment scores over the last 5 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={sentimentTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="joy" stroke="#10b981" name="Joy" />
                <Line type="monotone" dataKey="anger" stroke="#ef4444" name="Anger" />
                <Line type="monotone" dataKey="fear" stroke="#f59e0b" name="Fear" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LucidePieChart className="h-5 w-5" />
              Task Status Breakdown
            </CardTitle>
            <CardDescription>Task completion status (last 30 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Tables */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Latest Tasks</CardTitle>
            <CardDescription>Most recent task submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-muted-foreground">User: {task.userId}</p>
                  </div>
                  <Badge
                    variant={
                      task.status === "verified" ? "default" : task.status === "completed" ? "secondary" : "outline"
                    }
                  >
                    {task.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Consultant Requests</CardTitle>
            <CardDescription>Pending consultant applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users
                .filter((u) => u.role === "consultant" && !u.verified)
                .slice(0, 5)
                .map((user) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{user.displayName}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge variant="outline">Pending</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
