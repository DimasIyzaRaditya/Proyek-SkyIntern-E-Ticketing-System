import { NextRequest, NextResponse } from "next/server";
import { getAdminMessagesSince } from "@/lib/admin-chat-store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = (searchParams.get("sessionId") ?? "").trim();
  const afterId = Number(searchParams.get("afterId") ?? "0");

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  const safeAfterId = Number.isFinite(afterId) ? afterId : 0;
  const messages = getAdminMessagesSince(sessionId, safeAfterId).map((message) => ({
    id: message.id,
    text: message.text,
    timestamp: message.timestamp,
  }));

  return NextResponse.json({ messages });
}
