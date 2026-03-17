"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";

export default function OnboardingPage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const createWorkspace = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast({ title: err.error ?? "Failed to create workspace", variant: "error" });
        return;
      }

      toast({ title: "Workspace created", variant: "success" });
      window.location.href = "/dashboard";
    } catch {
      toast({ title: "Something went wrong", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="max-w-md w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create your workspace</h1>
          <p className="text-muted-foreground">
            Give your team a name and start building automations.
          </p>
        </div>

        <Input
          label="Workspace name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Automation Team"
        />

        <Button className="w-full" onClick={createWorkspace} isLoading={loading}>
          Continue
        </Button>
      </div>
    </div>
  );
}
