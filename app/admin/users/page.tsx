"use client"

import { useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useUsers, userActions, type User } from "@/lib/firestore-hooks"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CSVExport } from "@/components/csv-export"
import { MoreHorizontal, Eye, UserX, Trash2, Copy } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"

export default function UsersPage() {
  const { users, loading, error, refetch } = useUsers({ pageSize: 100 })
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const { toast } = useToast()

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    try {
      await userActions.toggleUserActive(userId, !currentActive)
      toast({
        title: "User status updated",
        description: `User has been ${!currentActive ? "activated" : "deactivated"}`,
      })
      refetch()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      try {
        await userActions.deleteUser(userId)
        toast({
          title: "User deleted",
          description: "User has been permanently deleted",
        })
        refetch()
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete user",
          variant: "destructive",
        })
      }
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: `${label} copied successfully`,
    })
  }

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "displayName",
      header: "User",
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName}`} />
              <AvatarFallback>{user.displayName?.charAt(0) || "U"}</AvatarFallback>
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
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("role") as string
        return <Badge variant={role === "consultant" ? "default" : "secondary"}>{role}</Badge>
      },
    },
    {
      accessorKey: "verified",
      header: "Status",
      cell: ({ row }) => {
        const user = row.original
        if (user.role === "consultant") {
          return <Badge variant={user.verified ? "default" : "outline"}>{user.verified ? "Verified" : "Pending"}</Badge>
        }
        return (
          <Badge variant={user.active !== false ? "default" : "destructive"}>
            {user.active !== false ? "Active" : "Inactive"}
          </Badge>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as any
        return format(date.toDate(), "MMM dd, yyyy")
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => copyToClipboard(user.id, "User ID")}>
                <Copy className="mr-2 h-4 w-4" />
                Copy ID
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToggleActive(user.id, user.active !== false)}>
                <UserX className="mr-2 h-4 w-4" />
                {user.active !== false ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDeleteUser(user.id)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  if (loading) return <div>Loading users...</div>
  if (error) return <div>Error: {error}</div>

  const csvColumns = [
    { key: "id", label: "User ID" },
    { key: "displayName", label: "Display Name" },
    { key: "email", label: "Email" },
    { key: "role", label: "Role" },
    { key: "verified", label: "Verified" },
    { key: "active", label: "Active" },
    { key: "createdAt", label: "Created At" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">Manage all users and consultants</p>
        </div>
        <CSVExport data={users} filename="users" columns={csvColumns} />
      </div>

      <DataTable columns={columns} data={users} searchKey="displayName" searchPlaceholder="Search users..." />

      {/* User Detail Sheet */}
      <Sheet open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          {selectedUser && (
            <>
              <SheetHeader>
                <SheetTitle>User Details</SheetTitle>
                <SheetDescription>View user profile and activity summary</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={`https://api.dicebear.com/7.x/initials/svg?seed=${selectedUser.displayName}`}
                        />
                        <AvatarFallback>{selectedUser.displayName?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div>{selectedUser.displayName}</div>
                        <div className="text-sm text-muted-foreground">{selectedUser.email}</div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">User ID:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-mono">{selectedUser.id}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(selectedUser.id, "User ID")}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Role:</span>
                      <Badge variant={selectedUser.role === "consultant" ? "default" : "secondary"}>
                        {selectedUser.role}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <Badge variant={selectedUser.verified ? "default" : "outline"}>
                        {selectedUser.verified ? "Verified" : "Pending"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Joined:</span>
                      <span className="text-sm">{format(selectedUser.createdAt.toDate(), "MMM dd, yyyy")}</span>
                    </div>
                  </CardContent>
                </Card>

                {selectedUser.role === "consultant" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Consultant Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {selectedUser.cvUrl && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">CV:</span>
                          <a
                            href={selectedUser.cvUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            View CV
                          </a>
                        </div>
                      )}
                      {selectedUser.linkedinUrl && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">LinkedIn:</span>
                          <a
                            href={selectedUser.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            View Profile
                          </a>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Privacy Notice</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Privacy-first: Admin cannot view diary content or chat messages. Only metadata and sentiment
                      analytics are available.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
