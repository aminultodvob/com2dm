"use client";

import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";

const pageTitles: Record<string, { title: string; description: string }> = {
  "/dashboard": {
    title: "Overview",
    description: "Your automation activity at a glance",
  },
  "/dashboard/connections": {
    title: "Connections",
    description: "Manage your Facebook & Instagram accounts",
  },
  "/dashboard/automations": {
    title: "Automations",
    description: "Create and manage keyword automation rules",
  },
  "/dashboard/logs": {
    title: "Delivery Logs",
    description: "Full audit trail of all message activity",
  },
  "/dashboard/analytics": {
    title: "Analytics",
    description: "Track performance and keyword trends",
  },
  "/dashboard/billing": {
    title: "Billing",
    description: "Manage your subscription and usage",
  },
  "/dashboard/settings": {
    title: "Settings",
    description: "Workspace and account preferences",
  },
};

export function DashboardTopbar() {
  const pathname = usePathname();

  // Find best match (for dynamic routes like /dashboard/automations/[id])
  const matchedKey = Object.keys(pageTitles)
    .filter((key) => pathname.startsWith(key))
    .sort((a, b) => b.length - a.length)[0];

  const meta = matchedKey ? pageTitles[matchedKey] : { title: "Dashboard", description: "" };

  return (
    <header className="flex items-center justify-between h-16 px-6 border-b border-border bg-card/50 backdrop-blur-sm shrink-0">
      <div>
        <h1 className="text-lg font-bold text-foreground">{meta.title}</h1>
        {meta.description && (
          <p className="text-xs text-muted-foreground">{meta.description}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Search placeholder */}
        <button className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-muted/50 text-muted-foreground text-sm hover:bg-muted transition-colors min-w-[180px]">
          <Search className="w-4 h-4" />
          <span>Search...</span>
          <kbd className="ml-auto text-xs bg-card border border-border rounded px-1.5 py-0.5">
            Ctrl+K
          </kbd>
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-xl hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
        </button>
      </div>
    </header>
  );
}

