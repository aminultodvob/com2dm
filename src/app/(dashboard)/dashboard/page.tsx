import { requireWorkspace } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  MessageCircle,
  Zap,
  TrendingUp,
  Link2,
  ArrowRight,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { formatNumber, timeAgo } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Overview" };

async function getDashboardStats(workspaceId: string) {
  const [
    totalRules,
    activeRules,
    connections,
    totalSent,
    totalFailed,
    recentLogs,
  ] = await Promise.all([
    db.automationRule.count({
      where: { workspaceId, deletedAt: null },
    }),
    db.automationRule.count({
      where: { workspaceId, status: "ACTIVE", deletedAt: null },
    }),
    db.connectedAsset.count({
      where: { workspaceId, isActive: true },
    }),
    db.messageDeliveryLog.count({
      where: { workspaceId, status: "SENT" },
    }),
    db.messageDeliveryLog.count({
      where: { workspaceId, status: "FAILED" },
    }),
    db.messageDeliveryLog.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return { totalRules, activeRules, connections, totalSent, totalFailed, recentLogs };
}

export default async function DashboardOverviewPage() {
  const { workspace } = await requireWorkspace();
  const stats = await getDashboardStats(workspace.id);
  const plan = workspace.subscription?.tier ?? "FREE";
  const hasConnections = stats.connections > 0;
  const hasRules = stats.totalRules > 0;

  const statCards = [
    {
      title: "DMs Sent",
      value: formatNumber(stats.totalSent),
      icon: MessageCircle,
      color: "text-violet-600",
      bg: "bg-violet-50",
      sub: "Total messages delivered",
    },
    {
      title: "Active Rules",
      value: stats.activeRules.toString(),
      icon: Zap,
      color: "text-blue-600",
      bg: "bg-blue-50",
      sub: `${stats.totalRules} total rules`,
    },
    {
      title: "Connections",
      value: stats.connections.toString(),
      icon: Link2,
      color: "text-green-600",
      bg: "bg-green-50",
      sub: "Facebook & Instagram",
    },
    {
      title: "Failed Sends",
      value: formatNumber(stats.totalFailed),
      icon: TrendingUp,
      color: "text-rose-600",
      bg: "bg-rose-50",
      sub: "Need attention",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Onboarding checklist */}
      {(!hasConnections || !hasRules) && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <CardTitle className="text-primary">
                Get started - complete your setup
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  done: true,
                  label: "Create your account",
                  href: null,
                },
                {
                  done: hasConnections,
                  label: "Connect a Facebook Page or Instagram account",
                  href: "/dashboard/connections",
                  cta: "Connect now",
                },
                {
                  done: hasRules,
                  label: "Create your first automation rule",
                  href: "/dashboard/automations/new",
                  cta: "Create rule",
                },
              ].map((step, i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {step.done ? (
                      <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                    )}
                    <span
                      className={`text-sm ${step.done ? "line-through text-muted-foreground" : "text-foreground"}`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {!step.done && step.href && (
                    <Link href={step.href}>
                      <Button size="sm" variant="outline">
                        {step.cta} <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.title} className="hover:shadow-md transition-all duration-200">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}
                >
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
              </div>
              <p className="text-3xl font-black text-foreground mb-0.5">
                {s.value}
              </p>
              <p className="text-sm font-medium text-foreground">{s.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent activity + Quick actions */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent logs */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              <Link href="/dashboard/logs">
                <Button variant="ghost" size="sm">
                  View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {stats.recentLogs.length === 0 ? (
              <div className="text-center py-10">
                <MessageCircle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  No messages sent yet.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Connect your accounts and create a rule to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center gap-3 py-2 border-b border-border last:border-0"
                  >
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                      {log.recipientName?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {log.recipientName ?? "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        Keyword: {log.matchedKeyword ?? "-"} �-{" "}
                        {log.platform.toLowerCase()}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <Badge
                        variant={
                          log.status === "SENT"
                            ? "success"
                            : log.status === "FAILED"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {log.status.toLowerCase()}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {timeAgo(log.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <Link href="/dashboard/automations/new" className="block">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Zap className="w-4 h-4 text-violet-500" />
                  New automation rule
                </Button>
              </Link>
              <Link href="/dashboard/connections" className="block">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Link2 className="w-4 h-4 text-blue-500" />
                  Connect account
                </Button>
              </Link>
              <Link href="/dashboard/logs" className="block">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <MessageCircle className="w-4 h-4 text-green-500" />
                  View delivery logs
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Plan card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Your Plan</CardTitle>
                <Badge variant="default">{plan}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {plan === "FREE"
                  ? "Upgrade to unlock more rules, accounts, and actions."
                  : plan === "STARTER"
                    ? "You're on Starter. Upgrade to Pro for unlimited everything."
                    : "You're on the Pro plan. All features unlocked."}
              </p>
              {plan !== "PRO" && (
                <Link href="/dashboard/billing">
                  <Button className="w-full">
                    Upgrade plan <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


