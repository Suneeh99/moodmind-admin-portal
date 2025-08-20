"use client"

import { useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useDiaryInsights, useUsers, type DiaryEntry } from "@/lib/firestore-hooks"
import { DataTable } from "@/components/ui/data-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CalendarIcon, BookOpen, TrendingUp, PieChart, Shield } from "lucide-react"
import { format, subDays } from "date-fns"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts"

export default function DiaryInsightsPage() {
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: subDays(new Date(), 30),
    end: new Date(),
  })
  const [emotionFilter, setEmotionFilter] = useState<string>("all")

  const { entries, loading, error } = useDiaryInsights(dateRange)
  const { users } = useUsers({ pageSize: 1000 })

  // Create user lookup map
  const userMap = users.reduce(
    (acc, user) => {
      acc[user.id] = user.displayName || user.email
      return acc
    },
    {} as Record<string, string>,
  )

  // Process sentiment data for charts
  const emotionDistribution = entries.reduce(
    (acc, entry) => {
      acc[entry.dominantEmotion] = (acc[entry.dominantEmotion] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const pieData = Object.entries(emotionDistribution).map(([emotion, count]) => ({
    name: emotion,
    value: count,
    color: getEmotionColor(emotion),
  }))

  // Process sentiment trend over time
  const sentimentTrend = entries
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

  // Filter entries for table
  const filteredEntries = entries.filter((entry) => {
    if (emotionFilter === "all") return true
    return entry.dominantEmotion === emotionFilter
  })

  const columns: ColumnDef<DiaryEntry>[] = [
    {
      accessorKey: "userId",
      header: "User",
      cell: ({ row }) => {
        const userId = row.getValue("userId") as string
        const userName = userMap[userId] || "Unknown User"
        return (
          <div>
            <div className="font-medium">{userName}</div>
            <div className="text-xs text-muted-foreground font-mono">{userId.slice(0, 8)}...</div>
          </div>
        )
      },
    },
    {
      accessorKey: "date",
      header: "Entry Date",
      cell: ({ row }) => {
        const date = row.getValue("date") as any
        return format(date.toDate(), "MMM dd, yyyy")
      },
    },
    {
      accessorKey: "dominantEmotion",
      header: "Dominant Emotion",
      cell: ({ row }) => {
        const emotion = row.getValue("dominantEmotion") as string
        return <Badge style={{ backgroundColor: getEmotionColor(emotion) }}>{emotion}</Badge>
      },
    },
    {
      accessorKey: "confidenceScore",
      header: "Confidence",
      cell: ({ row }) => {
        const score = row.getValue("confidenceScore") as number
        return (
          <div className="flex items-center space-x-2">
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.round(score * 100)}%` }} />
            </div>
            <span className="text-sm">{Math.round(score * 100)}%</span>
          </div>
        )
      },
    },
    {
      accessorKey: "sentimentAnalysis",
      header: "Sentiment Breakdown",
      cell: ({ row }) => {
        const sentiment = row.getValue("sentimentAnalysis") as any
        return (
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs">
              <span className="w-8">Joy:</span>
              <div className="w-12 bg-gray-200 rounded h-1">
                <div className="bg-green-500 h-1 rounded" style={{ width: `${sentiment.joy * 100}%` }} />
              </div>
              <span>{Math.round(sentiment.joy * 100)}%</span>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="w-8">Fear:</span>
              <div className="w-12 bg-gray-200 rounded h-1">
                <div className="bg-yellow-500 h-1 rounded" style={{ width: `${sentiment.fear * 100}%` }} />
              </div>
              <span>{Math.round(sentiment.fear * 100)}%</span>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="w-8">Anger:</span>
              <div className="w-12 bg-gray-200 rounded h-1">
                <div className="bg-red-500 h-1 rounded" style={{ width: `${sentiment.anger * 100}%` }} />
              </div>
              <span>{Math.round(sentiment.anger * 100)}%</span>
            </div>
          </div>
        )
      },
    },
  ]

  if (loading) return <div>Loading diary insights...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Diary Insights</h1>
        <p className="text-muted-foreground">Sentiment analysis and emotional trends</p>
      </div>

      {/* Privacy Banner */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Privacy-first:</strong> Admin cannot view diary content or text. Only metadata and sentiment analytics
          are available.
        </AlertDescription>
      </Alert>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(dateRange.start, "MMM dd")} - {format(dateRange.end, "MMM dd")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{ from: dateRange.start, to: dateRange.end }}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  setDateRange({ start: range.from, end: range.to })
                }
              }}
            />
          </PopoverContent>
        </Popover>

        <Select value={emotionFilter} onValueChange={setEmotionFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by emotion" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Emotions</SelectItem>
            {Object.keys(emotionDistribution).map((emotion) => (
              <SelectItem key={emotion} value={emotion}>
                {emotion} ({emotionDistribution[emotion]})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Dominant Emotions Distribution
            </CardTitle>
            <CardDescription>Breakdown of primary emotions in diary entries</CardDescription>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Average Sentiment Over Time
            </CardTitle>
            <CardDescription>Daily average sentiment scores</CardDescription>
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
      </div>

      {/* Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Diary Entries Overview
          </CardTitle>
          <CardDescription>Sentiment analysis results for individual entries</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredEntries}
            searchKey="userId"
            searchPlaceholder="Search by user..."
          />
        </CardContent>
      </Card>
    </div>
  )
}

function getEmotionColor(emotion: string): string {
  const colors: Record<string, string> = {
    joy: "#10b981",
    happiness: "#10b981",
    sadness: "#3b82f6",
    anger: "#ef4444",
    fear: "#f59e0b",
    surprise: "#8b5cf6",
    disgust: "#84cc16",
    neutral: "#6b7280",
  }
  return colors[emotion.toLowerCase()] || "#6b7280"
}
