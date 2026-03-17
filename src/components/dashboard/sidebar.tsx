"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Link2,
  Zap,
  FileText,
  BarChart3,
  CreditCard,
  Settings,
  LogOut,
  MessageCircle,
  ChevronRight,
} from "lucide-react";

const navItems = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Connections",
    href: "/dashboard/connections",
    icon: Link2,
  },
  {
    label: "Automations",
    href: "/dashboard/automations",
    icon: Zap,
  },
  {
    label: "Logs",
    href: "/dashboard/logs",
    icon: FileText,
  },
  {
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    label: "Billing",
    href: "/dashboard/billing",
    icon: CreditCard,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

interface SidebarProps {
  workspaceName: string;
  userEmail: string;
  userName: string;
  plan: string;
}

export function DashboardSidebar({
  workspaceName,
  userEmail,
  userName,
  plan,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col h-full w-64 bg-card border-r border-border">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-border shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <MessageCircle className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm text-foreground truncate">
            Comment<span className="text-primary">2DM</span>
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {workspaceName}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {isActive && (
                <ChevronRight className="w-3.5 h-3.5 opacity-70" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Plan badge */}
      <div className="px-3 pb-2">
        <Link href="/dashboard/billing">
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors cursor-pointer">
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                {plan} Plan
              </p>
              <p className="text-xs text-muted-foreground">Upgrade for more</p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-primary" />
          </div>
        </Link>
      </div>

      {/* User profile */}
      <div className="p-3 border-t border-border shrink-0">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
            {userName?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">
              {userName}
            </p>
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
