import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiWorkspace } from "@/lib/auth-helpers";
import { fetchPagePosts, fetchInstagramMedia } from "@/lib/meta";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ctx = await requireApiWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const assetId = searchParams.get("assetId");

  if (!assetId) {
    return NextResponse.json({ error: "assetId is required" }, { status: 400 });
  }

  const asset = await db.connectedAsset.findFirst({
    where: { id: assetId, workspaceId: ctx.workspace.id, isActive: true },
  });

  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  try {
    if (asset.assetType === "FACEBOOK_PAGE") {
      const posts = await fetchPagePosts(asset.externalAssetId, asset.accessToken);
      
      const formatted = posts.data.map((post) => ({
        id: post.id,
        title: post.message ? post.message.slice(0, 60) + "..." : "Untitled Post",
        thumbnailUrl: post.full_picture || null,
        permalink: post.permalink_url,
        timestamp: post.created_time,
      }));

      return NextResponse.json({ posts: formatted });
    }

    if (asset.assetType === "INSTAGRAM_ACCOUNT") {
      const media = await fetchInstagramMedia(asset.externalAssetId, asset.accessToken);

      const formatted = media.data.map((item) => ({
        id: item.id,
        title: item.caption ? item.caption.slice(0, 60) + "..." : "Untitled Post",
        thumbnailUrl: item.media_url || null,
        permalink: item.permalink,
        timestamp: item.timestamp,
      }));

      return NextResponse.json({ posts: formatted });
    }

    return NextResponse.json({ error: "Unsupported asset type" }, { status: 400 });
  } catch (error) {
    console.error("Meta Graph fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch posts from Meta" }, { status: 500 });
  }
}
