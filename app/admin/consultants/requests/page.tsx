"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { useUsers, userActions, type User } from "@/lib/firestore-hooks"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { CSVExport } from "@/components/csv-export"
import { CheckCircle, XCircle, ExternalLink } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"

export default function ConsultantRequestsPage() {
  const { users, loading, error, refetch } = useUsers({
    role: "consultant",
    verified: false,
    pageSize: 100,
  })
  const { toast } = useToast()

  const handleApprove = async (userId: string) => {
    try {
      await userActions.approveConsultant(userId)
      toast({
        title: "Consultant approved",
        description: "The consultant application has been approved",
      })
      refetch()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve consultant",
        variant: "destructive",
      })
    }
  }

  const handleReject = async (userId: string) => {
    try {
      await userActions.rejectConsultant(userId, "Application rejected by admin")
      toast({
        title: "Consultant rejected",
        description: "The consultant application has been rejected",
      })
      refetch()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject consultant",
        variant: "destructive",
      })
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
      header: "Applied",
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as any
        return format(date.toDate(), "MMM dd, yyyy")
      },
    },
    {
      accessorKey: "cvUrl",
      header: "CV",
      cell: ({ row }) => {
        const cvUrl = row.getValue("cvUrl") as string
        return cvUrl ? (
          <a
            href={cvUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-blue-600 hover:underline"
          >
            <ExternalLink className="mr-1 h-3 w-3" />
            View CV
          </a>
        ) : (
          <span className="text-muted-foreground">Not provided</span>
        )
      },
    },
    {
      accessorKey: "linkedinUrl",
      header: "LinkedIn",
      cell: ({ row }) => {
        const linkedinUrl = row.getValue("linkedinUrl") as string
        return linkedinUrl ? (
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-blue-600 hover:underline"
          >
            <ExternalLink className="mr-1 h-3 w-3" />
            Profile
          </a>
        ) : (
          <span className="text-muted-foreground">Not provided</span>
        )
      },
    },
    {
      id: "status",
      header: "Status",
      cell: () => <Badge variant="outline">Pending</Badge>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center space-x-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="default">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Approve
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Approve Consultant</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to approve {user.displayName} as a consultant? They will gain access to the
                    consultant features.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleApprove(user.id)}>Approve</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive">
                  <XCircle className="mr-1 h-3 w-3" />
                  Reject
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reject Consultant Application</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to reject {user.displayName}'s consultant application? This action cannot be
                    undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleReject(user.id)}
                    className="bg-destructive text-destructive-foreground"
                  >
                    Reject
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )
      },
    },
  ]

  if (loading) return <div>Loading consultant requests...</div>
  if (error) return <div>Error: {error}</div>

  const csvColumns = [
    { key: "id", label: "User ID" },
    { key: "displayName", label: "Name" },
    { key: "email", label: "Email" },
    { key: "createdAt", label: "Applied Date" },
    { key: "cvUrl", label: "CV URL" },
    { key: "linkedinUrl", label: "LinkedIn URL" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Consultant Requests</h1>
          <p className="text-muted-foreground">Review and approve consultant applications</p>
        </div>
        {users.length > 0 && <CSVExport data={users} filename="consultant-requests" columns={csvColumns} />}
      </div>

      {users.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No pending consultant requests</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={users}
          searchKey="displayName"
          searchPlaceholder="Search consultant requests..."
        />
      )}
    </div>
  )
}
