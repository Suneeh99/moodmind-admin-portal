"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { useEmergencyContacts, type EmergencyContact } from "@/lib/firestore-hooks"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CSVExport } from "@/components/csv-export"
import { Copy, Phone } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"

export default function SOSContactsPage() {
  const { contacts, loading, error } = useEmergencyContacts()
  const { toast } = useToast()

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "Phone number copied successfully",
    })
  }

  const columns: ColumnDef<EmergencyContact>[] = [
    {
      accessorKey: "name",
      header: "Contact Name",
      cell: ({ row }) => {
        const contact = row.original
        return (
          <div>
            <div className="font-medium">{contact.name}</div>
            <div className="text-sm text-muted-foreground">User ID: {contact.userId}</div>
          </div>
        )
      },
    },
    {
      accessorKey: "relationship",
      header: "Relationship",
      cell: ({ row }) => {
        const relationship = row.getValue("relationship") as string
        return <Badge variant="secondary">{relationship}</Badge>
      },
    },
    {
      accessorKey: "phoneNumber",
      header: "Phone Number",
      cell: ({ row }) => {
        const phoneNumber = row.getValue("phoneNumber") as string
        return (
          <div className="flex items-center space-x-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono">{phoneNumber}</span>
            <Button size="sm" variant="ghost" onClick={() => copyToClipboard(phoneNumber)} className="h-6 w-6 p-0">
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: "Added",
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as any
        return format(date.toDate(), "MMM dd, yyyy")
      },
    },
    {
      accessorKey: "updatedAt",
      header: "Last Updated",
      cell: ({ row }) => {
        const date = row.getValue("updatedAt") as any
        return format(date.toDate(), "MMM dd, yyyy")
      },
    },
  ]

  if (loading) return <div>Loading emergency contacts...</div>
  if (error) return <div>Error: {error}</div>

  const csvColumns = [
    { key: "id", label: "Contact ID" },
    { key: "userId", label: "User ID" },
    { key: "name", label: "Contact Name" },
    { key: "phoneNumber", label: "Phone Number" },
    { key: "relationship", label: "Relationship" },
    { key: "createdAt", label: "Created At" },
    { key: "updatedAt", label: "Updated At" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SOS Emergency Contacts</h1>
          <p className="text-muted-foreground">Emergency contacts registered by users</p>
        </div>
        <CSVExport data={contacts} filename="emergency-contacts" columns={csvColumns} />
      </div>

      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <Phone className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900 dark:text-blue-100">Emergency Contact Information</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              These contacts are provided by users for emergency situations. Click the copy button to copy phone numbers
              to clipboard.
            </p>
          </div>
        </div>
      </div>

      <DataTable columns={columns} data={contacts} searchKey="name" searchPlaceholder="Search contacts..." />
    </div>
  )
}
