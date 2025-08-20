"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useUsers, useTasks } from "@/lib/firestore-hooks"
import { Search, User, CheckSquare, UserCheck } from "lucide-react"

interface GlobalSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const router = useRouter()

  const { users } = useUsers({ pageSize: 100 })
  const { tasks } = useTasks()

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const searchQuery = query.toLowerCase()
    const searchResults: any[] = []

    // Search users
    users
      .filter(
        (user) =>
          user.displayName?.toLowerCase().includes(searchQuery) ||
          user.email?.toLowerCase().includes(searchQuery) ||
          user.id.toLowerCase().includes(searchQuery),
      )
      .slice(0, 5)
      .forEach((user) => {
        searchResults.push({
          type: "user",
          id: user.id,
          title: user.displayName || user.email,
          subtitle: user.email,
          badge: user.role,
          href: "/admin/users",
          icon: User,
        })
      })

    // Search consultants
    users
      .filter(
        (user) =>
          user.role === "consultant" &&
          (user.displayName?.toLowerCase().includes(searchQuery) ||
            user.email?.toLowerCase().includes(searchQuery) ||
            user.id.toLowerCase().includes(searchQuery)),
      )
      .slice(0, 3)
      .forEach((user) => {
        searchResults.push({
          type: "consultant",
          id: user.id,
          title: user.displayName || user.email,
          subtitle: user.verified ? "Verified Consultant" : "Pending Approval",
          badge: user.verified ? "verified" : "pending",
          href: user.verified ? "/admin/consultants" : "/admin/consultants/requests",
          icon: UserCheck,
        })
      })

    // Search tasks
    tasks
      .filter(
        (task) =>
          task.title?.toLowerCase().includes(searchQuery) ||
          task.userId.toLowerCase().includes(searchQuery) ||
          task.id.toLowerCase().includes(searchQuery),
      )
      .slice(0, 5)
      .forEach((task) => {
        searchResults.push({
          type: "task",
          id: task.id,
          title: task.title,
          subtitle: `User: ${task.userId.slice(0, 8)}... | ${task.status}`,
          badge: task.status,
          href: "/admin/tasks",
          icon: CheckSquare,
        })
      })

    setResults(searchResults.slice(0, 10))
  }, [query, users, tasks])

  const handleSelect = (result: any) => {
    router.push(result.href)
    onOpenChange(false)
    setQuery("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && results.length > 0) {
      handleSelect(results[0])
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Search users, consultants, tasks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full"
            autoFocus
          />
          {results.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {results.map((result) => (
                <div
                  key={`${result.type}-${result.id}`}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent cursor-pointer"
                  onClick={() => handleSelect(result)}
                >
                  <result.icon className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{result.title}</div>
                    <div className="text-sm text-muted-foreground truncate">{result.subtitle}</div>
                  </div>
                  <Badge variant="outline">{result.badge}</Badge>
                </div>
              ))}
            </div>
          )}
          {query && results.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">No results found</div>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          Press <kbd className="px-1 py-0.5 bg-muted rounded">Enter</kbd> to select first result
        </div>
      </DialogContent>
    </Dialog>
  )
}
