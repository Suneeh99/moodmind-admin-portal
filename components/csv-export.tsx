"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CSVExportProps {
  data: any[]
  filename: string
  columns: { key: string; label: string }[]
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
}

export function CSVExport({ data, filename, columns, variant = "outline", size = "sm" }: CSVExportProps) {
  const { toast } = useToast()

  const exportToCSV = () => {
    try {
      // Create CSV headers
      const headers = columns.map((col) => col.label).join(",")

      // Create CSV rows
      const rows = data.map((item) => {
        return columns
          .map((col) => {
            let value = item[col.key]

            // Handle nested objects (like timestamps)
            if (value && typeof value === "object" && value.toDate) {
              value = value.toDate().toISOString()
            } else if (value && typeof value === "object") {
              value = JSON.stringify(value)
            }

            // Escape commas and quotes
            if (typeof value === "string") {
              value = value.replace(/"/g, '""')
              if (value.includes(",") || value.includes('"') || value.includes("\n")) {
                value = `"${value}"`
              }
            }

            return value || ""
          })
          .join(",")
      })

      // Combine headers and rows
      const csvContent = [headers, ...rows].join("\n")

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `${filename}-${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Export successful",
        description: `${data.length} records exported to ${filename}.csv`,
      })
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error exporting the data",
        variant: "destructive",
      })
    }
  }

  return (
    <Button variant={variant} size={size} onClick={exportToCSV}>
      <Download className="mr-2 h-4 w-4" />
      Export CSV
    </Button>
  )
}
