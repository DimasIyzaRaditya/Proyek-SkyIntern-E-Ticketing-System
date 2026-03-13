import { NextRequest, NextResponse } from "next/server";
import { ensureAdminChatSession } from "@/lib/admin-chat-store";

type StartBody = {
  sessionId?: string;
  userId?: number | null;
};

export async function POST(req: NextRequest) {
  let body: StartBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sessionId = (body.sessionId ?? "").trim();
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  const userId = typeof body.userId === "number" ? body.userId : null;
  ensureAdminChatSession(sessionId, userId);

  return NextResponse.json({ ok: true, sessionId });
}
