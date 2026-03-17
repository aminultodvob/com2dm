"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";

type ConnectedAssetOption = {
  id: string;
  name: string;
  assetType: string;
};

type RuleData = {
  id: string;
  name: string;
  description?: string | null;
  platform: "FACEBOOK" | "INSTAGRAM" | "BOTH";
  matchMode: "CONTAINS" | "EXACT" | "STARTS_WITH";
  cooldownHours: number;
  connectedAssetId: string | null;
  keywords: { keyword: string }[];
  messageTemplate?: { body: string } | null;
};

function normalizeKeywords(input: string) {
  return input
    .split(/[,\\n]/)
    .map((kw) => kw.trim())
    .filter(Boolean);
}

export function AutomationForm({
  assets,
  initialRule,
}: {
  assets: ConnectedAssetOption[];
  initialRule?: RuleData;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(initialRule?.name ?? "");
  const [description, setDescription] = useState(initialRule?.description ?? "");
  const [platform, setPlatform] = useState<RuleData["platform"]>(
    initialRule?.platform ?? "BOTH"
  );
  const [matchMode, setMatchMode] = useState<RuleData["matchMode"]>(
    initialRule?.matchMode ?? "CONTAINS"
  );
  const [cooldownHours, setCooldownHours] = useState(
    initialRule?.cooldownHours ?? 24
  );
  const [connectedAssetId, setConnectedAssetId] = useState<string | "all">(
    initialRule?.connectedAssetId ?? "all"
  );
  const [keywords, setKeywords] = useState(
    initialRule?.keywords.map((k) => k.keyword).join(", ") ?? ""
  );
  const [messageBody, setMessageBody] = useState(
    initialRule?.messageTemplate?.body ?? ""
  );

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const payload = {
        name,
        description: description || undefined,
        platform,
        matchMode,
        cooldownHours: Number(cooldownHours),
        connectedAssetId: connectedAssetId === "all" ? null : connectedAssetId,
        keywords: normalizeKeywords(keywords),
        messageBody,
      };

      const res = await fetch(
        initialRule ? `/api/automations/${initialRule.id}` : "/api/automations",
        {
          method: initialRule ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        toast({ title: err.error ?? "Failed to save rule", variant: "error" });
        return;
      }

      toast({
        title: initialRule ? "Automation updated" : "Automation created",
        variant: "success",
      });

      window.location.href = "/dashboard/automations";
    } catch {
      toast({ title: "Something went wrong", variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          {initialRule ? "Edit Automation" : "Create Automation"}
        </h2>
        <p className="text-muted-foreground">
          Configure the comment keywords and the message sent to matching users.
        </p>
      </div>

      <div className="space-y-5">
        <Input
          label="Rule name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Pricing keyword rule"
        />
        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
        />

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground">
              Platform
            </label>
            <select
              className="mt-1 w-full h-10 rounded-xl border border-input bg-card px-3 text-sm"
              value={platform}
              onChange={(e) =>
                setPlatform(e.target.value as RuleData["platform"])
              }
            >
              <option value="BOTH">Instagram + Facebook</option>
              <option value="INSTAGRAM">Instagram only</option>
              <option value="FACEBOOK">Facebook only</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">
              Match mode
            </label>
            <select
              className="mt-1 w-full h-10 rounded-xl border border-input bg-card px-3 text-sm"
              value={matchMode}
              onChange={(e) =>
                setMatchMode(e.target.value as RuleData["matchMode"])
              }
            >
              <option value="CONTAINS">Contains</option>
              <option value="EXACT">Exact match</option>
              <option value="STARTS_WITH">Starts with</option>
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground">
              Apply to account
            </label>
            <select
              className="mt-1 w-full h-10 rounded-xl border border-input bg-card px-3 text-sm"
              value={connectedAssetId}
              onChange={(e) => setConnectedAssetId(e.target.value)}
            >
              <option value="all">All connected accounts</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Cooldown hours"
            type="number"
            value={cooldownHours}
            onChange={(e) => setCooldownHours(Number(e.target.value))}
            placeholder="24"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">
            Keywords (comma or new line separated)
          </label>
          <textarea
            className="mt-1 w-full min-h-[90px] rounded-xl border border-input bg-card px-3 py-2 text-sm"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="price, pricing, cost"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">
            Message body
          </label>
          <textarea
            className="mt-1 w-full min-h-[140px] rounded-xl border border-input bg-card px-3 py-2 text-sm"
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            placeholder="Thanks for asking! Here is our pricing link: ..."
          />
          <p className="text-xs text-muted-foreground mt-2">
            Variables: {"{{commenter_name}}"}, {"{{keyword}}"}, {"{{post_link}}"},
            {"{{workspace_name}}"}
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} isLoading={isLoading}>
          {initialRule ? "Save changes" : "Create rule"}
        </Button>
      </div>
    </div>
  );
}
