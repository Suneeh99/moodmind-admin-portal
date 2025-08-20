"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Settings, Shield, Key, Clock, Info } from "lucide-react"

export default function SettingsPage() {
  const [requireReauth, setRequireReauth] = useState(false)

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@yourdomain.com"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Settings</h1>
        <p className="text-muted-foreground">Manage admin account and system settings</p>
      </div>

      {/* Admin Account */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Account
          </CardTitle>
          <CardDescription>Current admin account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Email Address</Label>
              <p className="text-sm text-muted-foreground">{adminEmail}</p>
            </div>
            <Badge variant="default">Active</Badge>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-sm font-medium">Password Management</Label>
            <p className="text-sm text-muted-foreground">
              To change the admin password, update the <code className="bg-muted px-1 rounded">ADMIN_PASSWORD</code>{" "}
              environment variable and redeploy the application.
            </p>
            <Alert>
              <Key className="h-4 w-4" />
              <AlertDescription>
                <strong>Security Note:</strong> Always use a strong, unique password for the admin account. Consider
                using a password manager to generate and store secure credentials.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Session Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Session Settings
          </CardTitle>
          <CardDescription>Configure admin session behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="require-reauth">Require re-login after 30 min idle</Label>
              <p className="text-sm text-muted-foreground">
                Force admin to re-authenticate after 30 minutes of inactivity
              </p>
            </div>
            <Switch id="require-reauth" checked={requireReauth} onCheckedChange={setRequireReauth} />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-sm font-medium">Current Session</Label>
            <div className="flex items-center space-x-2">
              <Badge variant="default">Active</Badge>
              <span className="text-sm text-muted-foreground">Session expires in 24 hours</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Policy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy Policy
          </CardTitle>
          <CardDescription>Data access and privacy guidelines</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Privacy-First Administration:</strong> This admin panel is designed with privacy as a core
              principle. The following data access restrictions are in place:
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">No Access to Diary Content</p>
                <p className="text-xs text-muted-foreground">
                  Admin cannot view or access the actual text content of user diary entries
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">No Access to Chat Messages</p>
                <p className="text-xs text-muted-foreground">
                  Admin cannot view chat messages between users and consultants (end-to-end encrypted)
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Access to Sentiment Analytics</p>
                <p className="text-xs text-muted-foreground">
                  Admin can view aggregated sentiment analysis and emotional trends
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Access to Emergency Contacts</p>
                <p className="text-xs text-muted-foreground">
                  Admin can view SOS emergency contacts for safety purposes
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">User Management</p>
                <p className="text-xs text-muted-foreground">
                  Admin can manage user accounts and consultant approvals (metadata only)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Information
          </CardTitle>
          <CardDescription>Application and environment details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-sm font-medium">Application</Label>
              <p className="text-sm text-muted-foreground">Mood Mind Admin Panel</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Version</Label>
              <p className="text-sm text-muted-foreground">1.0.0</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Environment</Label>
              <Badge variant="outline">{process.env.NODE_ENV || "development"}</Badge>
            </div>
            <div>
              <Label className="text-sm font-medium">Last Updated</Label>
              <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
