import { requireWorkspace } from "@/lib/auth-helpers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Building, Shield, Bell, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { user, workspace } = await requireWorkspace();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Settings</h2>
        <p className="text-muted-foreground">Manage your workspace and account preferences</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar Nav */}
        <div className="space-y-1">
          {[
            { label: "Profile", icon: User, active: true },
            { label: "Workspace", icon: Building },
            { label: "Security", icon: Shield },
            { label: "Notifications", icon: Bell },
            { label: "Developer", icon: Database },
          ].map((item) => (
            <button
              key={item.label}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                item.active 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Workspace Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Workspace Profile</CardTitle>
              <CardDescription>Public information about your workspace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Workspace Name" defaultValue={workspace.name} />
                <Input label="Workspace Slug" defaultValue={workspace.slug} disabled />
              </div>
              <Input label="Website URL" placeholder="https://yourstore.com" />
            </CardContent>
            <div className="px-6 py-4 bg-muted/30 border-t border-border flex justify-end">
              <Button size="sm">Save Changes</Button>
            </div>
          </Card>

          {/* User Profile */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your account details and contact email</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Full Name" defaultValue={user.name || ""} />
                <Input label="Email Address" defaultValue={user.email || ""} disabled />
              </div>
              <div className="flex items-center gap-4 mt-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                  {user.name?.[0]?.toUpperCase() ?? "U"}
                </div>
                <Button variant="outline" size="sm">Change Avatar</Button>
              </div>
            </CardContent>
            <div className="px-6 py-4 bg-muted/30 border-t border-border flex justify-end">
              <Button size="sm">Save Changes</Button>
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200 bg-red-50/10">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions for your workspace</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-foreground">Delete Workspace</p>
                  <p className="text-xs text-muted-foreground">Permanently delete this workspace and all its data (rules, logs, assets).</p>
                </div>
                <Button variant="destructive" size="sm">Delete</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
