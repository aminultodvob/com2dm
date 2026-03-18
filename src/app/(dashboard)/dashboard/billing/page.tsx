import { requireWorkspace } from "@/lib/auth-helpers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Check, 
  ArrowRight, 
  Zap,
  ShieldCheck,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getOrCreateUsage } from "@/lib/usage";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingPage() {
  const { workspace } = await requireWorkspace();
  const subscription = workspace.subscription;
  const plan = subscription?.tier ?? "FREE";
  
  const usage = await getOrCreateUsage(workspace.id);
  const limit = plan === 'FREE' ? 100 : plan === 'STARTER' ? 1000 : 10000;
  const used = usage.messagesSent;
  const percentage = Math.min(100, Math.max(0, (used / limit) * 100));
  
  const plans = [
    {
      name: "FREE",
      price: "$0",
      description: "Basic features for testing",
      features: ["1 account", "3 rules", "100 actions/mo"],
      current: plan === "FREE",
    },
    {
      name: "STARTER",
      price: "$29",
      description: "For growing creators",
      features: ["3 accounts", "5 rules", "1,000 actions/mo", "Analytics"],
      current: plan === "STARTER",
    },
    {
      name: "PRO",
      price: "$79",
      description: "Complete automation power",
      features: ["Unlimited accounts", "Unlimited rules", "10,000 actions/mo", "Priority support"],
      current: plan === "PRO",
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Billing & Subscription</h2>
          <p className="text-muted-foreground">Manage your plan and usage limits</p>
        </div>
        {plan !== "FREE" && (
          <form action="/api/billing/portal" method="POST">
            <Button variant="outline" className="gap-2" type="submit">
              Customer Portal
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        )}
      </div>

      {/* Current Plan Overview */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-foreground">Current Plan: {plan}</h3>
                  <Badge variant="success" className="text-[10px] uppercase font-bold">Active</Badge>
                </div>
              <p className="text-sm text-muted-foreground">
                Next billing date: {subscription?.currentPeriodEnd?.toDateString() ?? "N/A"}
              </p>
            </div>
          </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right mr-2 hidden sm:block">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Monthly Usage</p>
                <p className="text-lg font-black text-foreground">{used} / {limit.toLocaleString()}</p>
              </div>
              <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${percentage}%` }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plans Comparison */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((p) => (
          <Card key={p.name} className={cn(
            "relative transition-all duration-300",
            p.current ? "border-primary ring-1 ring-primary/20 shadow-xl" : "hover:shadow-md"
          )}>
            {p.current && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-white border-none px-3 font-bold text-[10px]">Your Plan</Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-lg font-bold">{p.name}</CardTitle>
              <CardDescription>{p.description}</CardDescription>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-black text-foreground">{p.price}</span>
                <span className="text-xs text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {p.features.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <form action="/api/billing/checkout" method="POST" className="w-full">
                <input type="hidden" name="tier" value={p.name} />
                <Button 
                  variant={p.current ? "outline" : "default"} 
                  className="w-full" 
                  disabled={p.current}
                  type="submit"
                >
                  {p.current ? "Current Plan" : `Upgrade to ${p.name}`}
                </Button>
              </form>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Security Info */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex gap-3">
            <ShieldCheck className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-foreground">Secure Payments</p>
              <p className="text-xs text-muted-foreground">All transactions are encrypted and processed securely by Stripe.</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex gap-3">
            <Clock className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-foreground">Cancel Anytime</p>
              <p className="text-xs text-muted-foreground">Switch plans or cancel your subscription at any time with one click.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
