import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const count = await db.webhookEventRaw.count();
    return NextResponse.json({
      ok: true,
      webhookEventRawCount: count,
      url: req.url,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: String(error),
        url: req.url,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const row = await db.webhookEventRaw.create({
      data: {
        platform: "FACEBOOK",
        eventType: "debug_manual_insert",
        workspaceId: null,
        payload: {
          source: "debug-route",
          body,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      ok: true,
      insertedId: row.id,
      timestamp: row.receivedAt.toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}
