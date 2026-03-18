"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { Loader2, Image as ImageIcon } from "lucide-react";

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
  applyToAllPosts?: boolean;
  specificPostId?: string | null;
  specificPostUrl?: string | null;
  keywords: { keyword: string }[];
  messageTemplate?: { body: string } | null;
};

type Post = {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  permalink: string;
  timestamp: string;
};

function normalizeKeywords(input: string) {
  return input
    .split(/[,\n]/)
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
  
  // Specific Post feature state
  const [applyToAllPosts, setApplyToAllPosts] = useState<boolean>(
    initialRule?.applyToAllPosts ?? true
  );
  const [specificPostId, setSpecificPostId] = useState<string | null>(
    initialRule?.specificPostId ?? null
  );
  const [specificPostUrl, setSpecificPostUrl] = useState<string | null>(
    initialRule?.specificPostUrl ?? null
  );
  const [isFetchingPosts, setIsFetchingPosts] = useState(false);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [showPostModal, setShowPostModal] = useState(false);

  const [keywords, setKeywords] = useState(
    initialRule?.keywords.map((k) => k.keyword).join(", ") ?? ""
  );
  const [messageBody, setMessageBody] = useState(
    initialRule?.messageTemplate?.body ?? ""
  );

  const handleFetchPosts = async () => {
    if (connectedAssetId === "all") {
      toast({ title: "Please select a specific account first", variant: "error" });
      return;
    }
    setIsFetchingPosts(true);
    try {
      const res = await fetch(`/api/automations/posts?assetId=${connectedAssetId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setRecentPosts(data.posts || []);
      setShowPostModal(true);
    } catch {
      toast({ title: "Failed to load recent posts from Meta", variant: "error" });
    } finally {
      setIsFetchingPosts(false);
    }
  };

  const handleSelectPost = (post: Post) => {
    setSpecificPostId(post.id);
    setSpecificPostUrl(post.thumbnailUrl || post.permalink);
    setShowPostModal(false);
  };

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
        applyToAllPosts,
        specificPostId: applyToAllPosts ? null : specificPostId,
        specificPostUrl: applyToAllPosts ? null : specificPostUrl,
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
              onChange={(e) => {
                setConnectedAssetId(e.target.value);
                setApplyToAllPosts(true);
                setSpecificPostId(null);
                setSpecificPostUrl(null);
              }}
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

        {connectedAssetId !== "all" && (
          <div className="p-4 border rounded-xl bg-card/50 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Post Selection
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  Do you want this automation to run on every post, or just one specific post?
                </p>
              </div>
              <div className="flex bg-muted p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setApplyToAllPosts(true)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    applyToAllPosts ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Any Post
                </button>
                <button
                  type="button"
                  onClick={() => setApplyToAllPosts(false)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    !applyToAllPosts ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Specific Post
                </button>
              </div>
            </div>

            {!applyToAllPosts && (
              <div className="pt-2 border-t flex items-center gap-4">
                {specificPostUrl ? (
                  <div className="w-16 h-16 rounded-lg border overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={specificPostUrl} alt="Selected Post" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg border border-dashed flex items-center justify-center bg-muted/50 shrink-0 text-muted-foreground">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}
                
                <div className="flex-1">
                  {specificPostId ? (
                    <div>
                      <p className="text-sm font-semibold text-foreground">Post Selected</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">ID: {specificPostId}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No post selected yet.</p>
                  )}
                </div>

                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={handleFetchPosts}
                  disabled={isFetchingPosts}
                >
                  {isFetchingPosts ? <Loader2 className="w-4 h-4 animate-spin" /> : "Select a Post"}
                </Button>
              </div>
            )}
          </div>
        )}

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

      {showPostModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border shadow-xl w-full max-w-4xl max-h-[85vh] rounded-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-muted/30">
              <h3 className="font-semibold text-lg">Select a Post</h3>
              <button 
                onClick={() => setShowPostModal(false)}
                className="text-muted-foreground hover:text-foreground p-2"
              >
                Close
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {recentPosts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                  <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No recent posts found on this account.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {recentPosts.map(post => (
                    <button
                      key={post.id}
                      onClick={() => handleSelectPost(post)}
                      className="group relative flex flex-col text-left border rounded-xl overflow-hidden hover:ring-2 hover:ring-primary hover:border-transparent transition-all"
                    >
                      <div className="aspect-square bg-muted shrink-0 relative">
                        {post.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={post.thumbnailUrl} 
                            alt={post.title} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <ImageIcon className="w-8 h-8 opacity-30" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-full">
                            Select Post
                          </span>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-xs text-muted-foreground mb-1">
                          {new Date(post.timestamp).toLocaleDateString()}
                        </p>
                        <p className="text-sm font-medium line-clamp-2 leading-tight">
                          {post.title}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
