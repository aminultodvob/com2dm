"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  Edit2, 
  MessageSquare,
  Facebook,
  Instagram
} from "lucide-react";
import { timeAgo, cn } from "@/lib/utils";
import { toast } from "@/components/ui/toaster";

interface RuleKeyword {
  keyword: string;
}

interface Rule {
  id: string;
  name: string;
  status: string;
  platform: string;
  totalSent: number;
  totalTriggers: number;
  createdAt: string;
  keywords: RuleKeyword[];
  connectedAsset: { name: string } | null;
}

interface AutomationsClientProps {
  initialRules: Rule[];
}

export function AutomationsClient({ initialRules }: AutomationsClientProps) {
  const [rules, setRules] = useState(initialRules);

  const toggleStatus = async (ruleId: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
    // Optimistic update
    setRules(rules.map(r => r.id === ruleId ? { ...r, status: newStatus } : r));
    
    try {
      const res = await fetch(`/api/automations/${ruleId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      toast({ title: `Rule ${newStatus.toLowerCase()}`, variant: "success" });
    } catch {
      setRules(rules.map(r => r.id === ruleId ? { ...r, status: currentStatus } : r));
      toast({ title: "Failed to update status", variant: "error" });
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm("Delete this automation?")) return;
    const existing = rules;
    setRules(rules.filter((rule) => rule.id !== ruleId));
    try {
      const res = await fetch(`/api/automations/${ruleId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast({ title: "Automation deleted", variant: "success" });
    } catch {
      setRules(existing);
      toast({ title: "Failed to delete rule", variant: "error" });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Your Automations</h2>
          <p className="text-muted-foreground">Manage your keyword-triggered behaviors</p>
        </div>
        <Link href="/dashboard/automations/new">
          <Button className="gap-2 shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" />
            Create New Rule
          </Button>
        </Link>
      </div>

      {rules.length === 0 ? (
        <Card className="border-dashed py-20">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
              <Zap className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">No automations yet</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              Create your first rule to start automatically responding to comments on Instagram and Facebook.
            </p>
            <Link href="/dashboard/automations/new">
              <Button size="lg" className="px-8">Get Started</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {rules.map((rule) => (
            <Card key={rule.id} className="group hover:border-primary/50 transition-all duration-200 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center gap-4 p-5">
                  {/* Platform Icon */}
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                    rule.platform === "INSTAGRAM" ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white" : "bg-blue-600 text-white"
                  )}>
                    {rule.platform === "INSTAGRAM" ? <Instagram className="w-6 h-6" /> : <Facebook className="w-6 h-6" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-foreground truncate">{rule.name}</h4>
                      <Badge variant={rule.status === "ACTIVE" ? "success" : "secondary"} className="text-[10px] uppercase font-bold px-1.5 py-0">
                        {rule.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {rule.keywords.map((k) => k.keyword).join(", ")}
                      </span>
                      <span>-</span>
                      <span>{rule.connectedAsset?.name ?? "All posts"}</span>
                      <span>-</span>
                      <span>Created {timeAgo(rule.createdAt)}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex flex-col items-end px-4 border-l border-border min-w-[100px]">
                    <p className="text-lg font-black text-foreground">{rule.totalSent}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Sent DMs</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9"
                      onClick={() => toggleStatus(rule.id, rule.status)}
                      title={rule.status === "ACTIVE" ? "Pause" : "Start"}
                    >
                      {rule.status === "ACTIVE" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Link href={`/dashboard/automations/${rule.id}`}>
                      <Button variant="ghost" size="icon" className="h-9 w-9" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-destructive"
                      title="Delete"
                      onClick={() => handleDelete(rule.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


