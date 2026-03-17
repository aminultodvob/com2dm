import { requireWorkspace } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  MessageCircle, 
  Zap, 
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Instagram,
  Facebook
} from "lucide-react";
import { formatNumber, cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Analytics" };

async function getAnalyticsData(workspaceId: string) {
  // In a real app, you'd aggregate these by day/month
  const [totalDMs, totalMatches, activeRules, successRate] = await Promise.all([
    db.messageDeliveryLog.count({ where: { workspaceId, status: "SENT" } }),
    db.triggerEventLog.count({ where: { workspaceId, wasMatched: true } }),
    db.automationRule.count({ where: { workspaceId, status: "ACTIVE", deletedAt: null } }),
    // Mock success rate
    Promise.resolve(98.4),
  ]);

  return { totalDMs, totalMatches, activeRules, successRate };
}

export default async function AnalyticsPage() {
  const { workspace } = await requireWorkspace();
  const stats = await getAnalyticsData(workspace.id);

  const mainStats = [
    {
      label: "Total DMs Sent",
      value: formatNumber(stats.totalDMs),
      change: "+12.5%",
      trend: "up",
      icon: MessageCircle,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: "Keyword Matches",
      value: formatNumber(stats.totalMatches),
      change: "+18.2%",
      trend: "up",
      icon: Target,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Active Rules",
      value: stats.activeRules.toString(),
      change: "0%",
      trend: "neutral",
      icon: Zap,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Delivery Rate",
      value: `${stats.successRate}%`,
      change: "+0.4%",
      trend: "up",
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-50",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Analytics</h2>
          <p className="text-muted-foreground">Track your automated conversation performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 bg-white">Last 30 Days</Badge>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mainStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.bg)}>
                  <stat.icon className={cn("w-5 h-5", stat.color)} />
                </div>
                <div className={cn(
                  "flex items-center text-xs font-bold",
                  stat.trend === "up" ? "text-green-600" : stat.trend === "down" ? "text-red-600" : "text-muted-foreground"
                )}>
                  {stat.trend === "up" && <ArrowUpRight className="w-3 h-3 mr-1" />}
                  {stat.trend === "down" && <ArrowDownRight className="w-3 h-3 mr-1" />}
                  {stat.change}
                </div>
              </div>
              <p className="text-3xl font-black text-foreground mb-1">{stat.value}</p>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Placeholder */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Conversation Activity</CardTitle>
            <CardDescription>Messages sent over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full bg-slate-50/50 rounded-2xl flex items-center justify-center border border-dashed border-border group">
              <div className="flex flex-col items-center gap-2 opacity-40 group-hover:opacity-60 transition-opacity">
                <BarChart3 className="w-12 h-12 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground italic">Chart data visualization placeholder</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Keywords</CardTitle>
            <CardDescription>Most triggered automation keywords</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { keyword: "price", count: 1284, share: 45 },
              { keyword: "guide", count: 843, share: 29 },
              { keyword: "join", count: 421, share: 15 },
              { keyword: "cost", count: 210, share: 7 },
              { keyword: "info", count: 112, share: 4 },
            ].map((kw) => (
              <div key={kw.keyword} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-foreground">
                    &quot;{kw.keyword}&quot;
                  </span>
                  <span className="text-muted-foreground font-medium">{kw.count} matches</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full" 
                    style={{ width: `${kw.share}%` }} 
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Conversion Proxy */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Distribution</CardTitle>
          <CardDescription>Activity split between Instagram and Facebook</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-8">
            <div className="flex items-center gap-4 p-6 rounded-2xl border border-border bg-slate-50/30">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                <Instagram className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-black text-foreground">72%</p>
                <p className="text-sm font-medium text-muted-foreground">Instagram Direct</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-6 rounded-2xl border border-border bg-slate-50/30">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                <Facebook className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-black text-foreground">28%</p>
                <p className="text-sm font-medium text-muted-foreground">Facebook Messenger</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
