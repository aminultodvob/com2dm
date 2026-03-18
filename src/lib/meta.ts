import { env } from "@/lib/env";
import { db } from "@/lib/db";

const GRAPH_BASE = "https://graph.facebook.com";

export type MetaPage = {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: { id: string };
  picture?: { data?: { url?: string } };
};

export type MetaIgAccount = {
  id: string;
  username?: string;
  name?: string;
  profile_picture_url?: string;
};

export function buildMetaAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: env.META_APP_ID ?? "",
    redirect_uri: env.META_REDIRECT_URI ?? "",
    response_type: "code",
    state,
    scope: [
      "pages_show_list",
      "pages_read_engagement",
      "pages_manage_metadata",
      "pages_messaging",
      "instagram_manage_comments",
      "instagram_manage_messages",
      "instagram_basic",
      "business_management",
    ].join(","),
  });

  return `https://www.facebook.com/${env.META_GRAPH_API_VERSION}/dialog/oauth?${params.toString()}`;
}

async function graphRequest<T>(path: string, params: Record<string, string>) {
  const url = new URL(`${GRAPH_BASE}/${env.META_GRAPH_API_VERSION}${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Meta API error ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export async function exchangeCodeForToken(code: string) {
  const params = {
    client_id: env.META_APP_ID ?? "",
    client_secret: env.META_APP_SECRET ?? "",
    redirect_uri: env.META_REDIRECT_URI ?? "",
    code,
  };
  return graphRequest<{ access_token: string }>("/oauth/access_token", params);
}

export async function exchangeForLongLivedToken(shortLivedToken: string) {
  const params = {
    grant_type: "fb_exchange_token",
    client_id: env.META_APP_ID ?? "",
    client_secret: env.META_APP_SECRET ?? "",
    fb_exchange_token: shortLivedToken,
  };
  return graphRequest<{ access_token: string; expires_in: number }>(
    "/oauth/access_token",
    params
  );
}

export async function fetchMe(accessToken: string) {
  return graphRequest<{ id: string; name?: string }>("/me", {
    fields: "id,name",
    access_token: accessToken,
  });
}

export async function fetchPages(accessToken: string) {
  return graphRequest<{ data: MetaPage[] }>("/me/accounts", {
    fields: "id,name,access_token,instagram_business_account,picture{url}",
    access_token: accessToken,
  });
}

export async function fetchInstagramAccount(
  igId: string,
  accessToken: string
) {
  return graphRequest<MetaIgAccount>(`/${igId}`, {
    fields: "id,username,name,profile_picture_url",
    access_token: accessToken,
  });
}

export type FacebookPost = {
  id: string;
  message?: string;
  created_time: string;
  full_picture?: string;
  permalink_url: string;
};

export async function fetchPagePosts(pageId: string, accessToken: string) {
  return graphRequest<{ data: FacebookPost[] }>(`/${pageId}/posts`, {
    fields: "id,message,created_time,full_picture,permalink_url",
    limit: "20",
    access_token: accessToken,
  });
}

export type InstagramMedia = {
  id: string;
  caption?: string;
  media_url?: string;
  permalink: string;
  timestamp: string;
};

export async function fetchInstagramMedia(igId: string, accessToken: string) {
  return graphRequest<{ data: InstagramMedia[] }>(`/${igId}/media`, {
    fields: "id,caption,media_url,permalink,timestamp",
    limit: "20",
    access_token: accessToken,
  });
}

export async function subscribePage(pageId: string, accessToken: string) {
  const url = new URL(`${GRAPH_BASE}/${env.META_GRAPH_API_VERSION}/${pageId}/subscribed_apps`);
  url.searchParams.set("access_token", accessToken);
  url.searchParams.set("subscribed_fields", "feed,messages,messaging_postbacks");
  const res = await fetch(url, { method: "POST" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Meta subscribe page error ${res.status}: ${text}`);
  }
  return res.json() as Promise<{ success: boolean }>;
}

/**
 * Subscribe a Facebook Page for Instagram webhooks.
 * Instagram comment/DM webhooks are delivered via the linked Facebook Page's subscription.
 * We call /subscribed_apps on the PAGE (not the IG account) with instagram-specific fields.
 */
export async function subscribeInstagram(pageId: string, accessToken: string) {
  const url = new URL(`${GRAPH_BASE}/${env.META_GRAPH_API_VERSION}/${pageId}/subscribed_apps`);
  url.searchParams.set("access_token", accessToken);
  url.searchParams.set(
    "subscribed_fields",
    "instagram_comments,instagram_mentions,instagram_messages"
  );
  const res = await fetch(url, { method: "POST" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Meta subscribe Instagram error ${res.status}: ${text}`);
  }
  return res.json() as Promise<{ success: boolean }>;
}

export async function upsertSocialConnection(input: {
  workspaceId: string;
  externalUserId: string;
  displayName?: string;
  accessToken: string;
}) {
  const existing = await db.socialConnection.findFirst({
    where: {
      workspaceId: input.workspaceId,
      platform: "FACEBOOK",
      externalUserId: input.externalUserId,
    },
  });

  if (existing) {
    return db.socialConnection.update({
      where: { id: existing.id },
      data: {
        displayName: input.displayName,
        accessToken: input.accessToken,
        isActive: true,
        updatedAt: new Date(),
      },
    });
  }

  return db.socialConnection.create({
    data: {
      workspaceId: input.workspaceId,
      platform: "FACEBOOK",
      externalUserId: input.externalUserId,
      displayName: input.displayName,
      accessToken: input.accessToken,
      scopes: [],
    },
  });
}

export async function upsertConnectedAsset(input: {
  workspaceId: string;
  socialConnectionId: string;
  assetType: "FACEBOOK_PAGE" | "INSTAGRAM_ACCOUNT";
  externalAssetId: string;
  name: string;
  username?: string | null;
  pictureUrl?: string | null;
  accessToken: string;
  instagramAccountId?: string | null;
  webhookSubscribed?: boolean;
}) {
  const existing = await db.connectedAsset.findFirst({
    where: {
      workspaceId: input.workspaceId,
      assetType: input.assetType,
      externalAssetId: input.externalAssetId,
    },
  });

  const data = {
    workspaceId: input.workspaceId,
    socialConnectionId: input.socialConnectionId,
    assetType: input.assetType,
    externalAssetId: input.externalAssetId,
    name: input.name,
    username: input.username ?? null,
    pictureUrl: input.pictureUrl ?? null,
    accessToken: input.accessToken,
    instagramAccountId: input.instagramAccountId ?? null,
    webhookSubscribed: input.webhookSubscribed ?? false,
    isActive: true,
  };

  if (existing) {
    return db.connectedAsset.update({
      where: { id: existing.id },
      data,
    });
  }

  return db.connectedAsset.create({ data });
}

export async function sendMetaMessage(input: {
  platform: "FACEBOOK" | "INSTAGRAM";
  /**
   * For FACEBOOK: the Page ID.
   * For INSTAGRAM: also the Facebook Page ID (NOT the IG account ID).
   * Instagram DMs must be sent via POST /{page_id}/messages with the page access token.
   */
  pageOrIgId: string;
  recipientId: string;
  commentId?: string; // Add optional commentId for Private Replies
  message: string;
  accessToken: string;
}) {
  if (input.commentId) {
    const privateReplyUrl = new URL(
      `${GRAPH_BASE}/${env.META_GRAPH_API_VERSION}/${input.commentId}/private_replies`
    );
    privateReplyUrl.searchParams.set("access_token", input.accessToken);

    const privateReplyRes = await fetch(privateReplyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: input.message,
      }),
    });

    const privateReplyJson = await privateReplyRes.json();
    if (!privateReplyRes.ok) {
      throw new Error(
        `Meta private reply error ${privateReplyRes.status}: ${JSON.stringify(
          privateReplyJson
        )}`
      );
    }
    return privateReplyJson;
  }

  const url = new URL(
    `${GRAPH_BASE}/${env.META_GRAPH_API_VERSION}/${input.pageOrIgId}/messages`
  );
  url.searchParams.set("access_token", input.accessToken);

  const recipient = { id: input.recipientId };
  
  const body: Record<string, unknown> = {
    recipient,
    message: { text: input.message },
  };

  // Instagram DMs require messaging_type field
  if (input.platform === "INSTAGRAM") {
    body.messaging_type = "RESPONSE";
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Meta send error ${res.status}: ${JSON.stringify(json)}`);
  }
  return json;
}
