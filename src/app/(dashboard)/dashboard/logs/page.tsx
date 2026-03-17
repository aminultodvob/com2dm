import { requireWorkspace } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Search, 
  Instagram, 
  Facebook,
  Download
} from "lucide-react";
import { formatDate, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Delivery Logs" };

export default async function LogsPage() {
  const { workspace } = await requireWorkspace();

  const logs = await db.messageDeliveryLog.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Delivery Logs</h2>
          <p className="text-muted-foreground">Full audit trail of all automated messages</p>
        </div>
        <a href="/api/logs/export">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </a>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name or keyword..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="px-3 py-1 cursor-pointer hover:bg-muted transition-colors">All Status</Badge>
              <Badge variant="outline" className="px-3 py-1 cursor-pointer hover:bg-muted transition-colors text-muted-foreground">Sent</Badge>
              <Badge variant="outline" className="px-3 py-1 cursor-pointer hover:bg-muted transition-colors text-muted-foreground">Failed</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Recipient</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Platform</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Keyword</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Triggered At</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <FileText className="w-10 h-10 text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground">No logs available yet.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {log.recipientName?.[0]?.toUpperCase() ?? "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{log.recipientName || "Unknown"}</p>
                            <p className="text-[10px] text-muted-foreground truncate font-medium">ID: {log.recipientId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          {log.platform === "INSTAGRAM" ? (
                            <Instagram className="w-3.5 h-3.5 text-pink-500" />
                          ) : (
                            <Facebook className="w-3.5 h-3.5 text-blue-600" />
                          )}
                          <span className="text-xs font-medium capitalize">{log.platform.toLowerCase()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="font-mono text-[10px] bg-slate-50">
                          {log.matchedKeyword || "-"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-foreground font-medium">{formatDate(log.createdAt)}</p>
                        <p className="text-[10px] text-muted-foreground">{timeAgo(log.createdAt)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge 
                          variant={
                            log.status === "SENT" ? "success" : 
                            log.status === "FAILED" ? "destructive" : "secondary"
                          }
                          className="text-[10px] font-bold"
                        >
                          {log.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" className="h-8 text-xs font-bold hover:bg-primary/10 hover:text-primary">
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {logs.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
          <p>Showing 1 to {logs.length} of {logs.length} records</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled className="h-8 px-4 text-xs">Previous</Button>
            <Button variant="outline" size="sm" disabled className="h-8 px-4 text-xs">Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}


