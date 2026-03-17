import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { db } from "@/lib/db";
import { requireApiAuth } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";
import { verifySignedPayload } from "@/lib/crypto";
import {
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  fetchMe,
  fetchPages,
  fetchInstagramAccount,
  subscribeInstagram,
  subscribePage,
  upsertConnectedAsset,
  upsertSocialConnection,
} from "@/lib/meta";

export async function GET(req: Request) {
  const user = await requireApiAuth();
  if (!user?.id) return NextResponse.redirect(new URL("/login", req.url));

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/dashboard/connections?error=meta", req.url));
  }

  if (!code || !state) {
    return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
  }

  if (!env.META_APP_ID || !env.META_APP_SECRET || !env.META_REDIRECT_URI) {
    return NextResponse.json({ error: "Meta credentials not configured" }, { status: 500 });
  }

  const payload = verifySignedPayload(state, env.AUTH_SECRET);
  if (!payload || payload.userId !== user.id) {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }

  const workspaceId = payload.workspaceId;

  const shortLived = await exchangeCodeForToken(code);
  const longLived = await exchangeForLongLivedToken(shortLived.access_token);

  const me = await fetchMe(longLived.access_token);
  const social = await upsertSocialConnection({
    workspaceId,
    externalUserId: me.id,
    displayName: me.name,
    accessToken: longLived.access_token,
  });

  const pages = await fetchPages(longLived.access_token);

  const activeAssetIds: string[] = [];

  for (const page of pages.data) {
    let pageSubscribed = false;
    try {
      const resp = await subscribePage(page.id, page.access_token);
      pageSubscribed = resp.success === true;
    } catch {
      pageSubscribed = false;
    }

    const pageAsset = await upsertConnectedAsset({
      workspaceId,
      socialConnectionId: social.id,
      assetType: "FACEBOOK_PAGE",
      externalAssetId: page.id,
      name: page.name,
      pictureUrl: page.picture?.data?.url ?? null,
      accessToken: page.access_token,
      instagramAccountId: page.instagram_business_account?.id ?? null,
      webhookSubscribed: pageSubscribed,
    });
    activeAssetIds.push(pageAsset.id);

    if (page.instagram_business_account?.id) {
      const ig = await fetchInstagramAccount(
        page.instagram_business_account.id,
        page.access_token
      );

      let igSubscribed = false;
      try {
        const resp = await subscribeInstagram(ig.id, page.access_token);
        igSubscribed = resp.success === true;
      } catch {
        igSubscribed = false;
      }

      const igAsset = await upsertConnectedAsset({
        workspaceId,
        socialConnectionId: social.id,
        assetType: "INSTAGRAM_ACCOUNT",
        externalAssetId: ig.id,
        name: ig.name ?? ig.username ?? "Instagram Account",
        username: ig.username ?? null,
        pictureUrl: ig.profile_picture_url ?? null,
        accessToken: page.access_token,
        instagramAccountId: page.instagram_business_account.id,
        webhookSubscribed: igSubscribed,
      });
      activeAssetIds.push(igAsset.id);
    }
  }

  if (activeAssetIds.length > 0) {
    await Promise.all([
      db.connectedAsset.updateMany({
        where: {
          workspaceId,
          id: { notIn: activeAssetIds },
        },
        data: { isActive: false },
      }),
    ]);
  }

  return NextResponse.redirect(new URL("/dashboard/connections?connected=1", req.url));
}
