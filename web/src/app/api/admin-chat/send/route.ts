import { NextRequest, NextResponse } from "next/server";
import { appendAdminChatMessage } from "@/lib/admin-chat-store";

type SendBody = {
  sessionId?: string;
  userId?: number | null;
  text?: string;
};

export async function POST(req: NextRequest) {
  let body: SendBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sessionId = (body.sessionId ?? "").trim();
  const text = (body.text ?? "").trim();

  if (!sessionId || !text) {
    return NextResponse.json({ error: "sessionId and text required" }, { status: 400 });
  }

  const userId = typeof body.userId === "number" ? body.userId : null;
  const created = appendAdminChatMessage({
    sessionId,
    userId,
    role: "user",
    text,
  });

  return NextResponse.json({ ok: true, messageId: created?.id ?? null });
}
