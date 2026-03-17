"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Facebook,
  Instagram,
  Link2,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Trash2,
  RefreshCw,
  Plus,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/toaster";

interface SocialConnection {
  id: string;
  platform: string;
  displayName: string | null;
  isActive: boolean;
  connectedAt: Date;
  lastSyncedAt: Date | null;
}

interface ConnectedAsset {
  id: string;
  assetType: string;
  name: string;
  username: string | null;
  isActive: boolean;
  webhookSubscribed: boolean;
  pictureUrl: string | null;
  createdAt: Date;
}

interface Props {
  socialConnections: SocialConnection[];
  connectedAssets: ConnectedAsset[];
  metaAuthUrl: string;
  workspaceId: string;
}

export function ConnectedAssetsClient({
  socialConnections,
  connectedAssets,
  metaAuthUrl,
}: Props) {
  const hasConnections = socialConnections.length > 0;
  const hasAssets = connectedAssets.length > 0;

  const handleDisconnect = async (assetId: string) => {
    try {
      const res = await fetch(`/api/connections/${assetId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast({ title: "Account disconnected", variant: "success" });
        window.location.reload();
      } else {
        toast({ title: "Failed to disconnect", variant: "error" });
      }
    } catch {
      toast({ title: "Something went wrong", variant: "error" });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Connect Meta */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle>Connect Meta Accounts</CardTitle>
              <CardDescription>
                Connect your Facebook Pages and Instagram Professional accounts
                via Meta&apos;s official OAuth
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Facebook */}
            <div className="border border-border rounded-xl p-5 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                  <Facebook className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Facebook Pages</p>
                  <p className="text-xs text-muted-foreground">
                    Automate comment DMs on your Pages
                  </p>
                </div>
              </div>
              <a href={metaAuthUrl}>
                <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4" />
                  Connect Facebook
                </Button>
              </a>
            </div>

            {/* Instagram */}
            <div className="border border-border rounded-xl p-5 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
                  <Instagram className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    Instagram Business
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Connect via linked Facebook Page
                  </p>
                </div>
              </div>
              <a href={metaAuthUrl}>
                <Button
                  className="w-full gap-2"
                  style={{
                    background:
                      "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)",
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Connect Instagram
                </Button>
              </a>
            </div>
          </div>

          {/* Info box */}
          <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-100 flex gap-3">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Meta App Review Required</p>
              <p className="text-xs text-amber-700">
                Full production access requires your Meta app to pass review for
                the <code>pages_messaging</code> and{" "}
                <code>instagram_manage_comments</code> permissions. During
                development, you can test with your own accounts as app testers.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connected assets */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Connected Accounts</CardTitle>
              <CardDescription>
                {hasAssets
                  ? `${connectedAssets.length} account${connectedAssets.length !== 1 ? "s" : ""} connected`
                  : "No accounts connected yet"}
              </CardDescription>
            </div>
            {hasConnections && (
              <Button variant="outline" size="sm" className="gap-2">
                <RefreshCw className="w-3.5 h-3.5" />
                Sync
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!hasAssets ? (
            <div className="text-center py-14">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Link2 className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No accounts connected
              </h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Connect a Facebook Page or Instagram Business account above to
                start automating your comment responses.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {connectedAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-muted/30 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-muted flex items-center justify-center shrink-0">
                    {asset.pictureUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={asset.pictureUrl}
                        alt={asset.name}
                        className="w-full h-full object-cover"
                      />
                    ) : asset.assetType === "FACEBOOK_PAGE" ? (
                      <Facebook className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Instagram className="w-5 h-5 text-pink-500" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-foreground text-sm">
                        {asset.name}
                      </p>
                      <Badge
                        variant={
                          asset.assetType === "FACEBOOK_PAGE"
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {asset.assetType === "FACEBOOK_PAGE"
                          ? "Facebook Page"
                          : "Instagram"}
                      </Badge>
                      {asset.isActive ? (
                        <Badge variant="success" className="text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="warning" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                      {asset.webhookSubscribed && (
                        <Badge variant="success" className="text-xs">
                          Webhook OK
                        </Badge>
                      )}
                    </div>
                    {asset.username && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        @{asset.username}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Connected {formatDate(asset.createdAt)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground w-8 h-8"
                      title="View on Meta"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive w-8 h-8"
                      onClick={() => handleDisconnect(asset.id)}
                      title="Disconnect"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


