import { NextRequest, NextResponse } from "next/server";
import { appendAdminChatMessage } from "@/lib/admin-chat-store";

type WebhookBody = {
  token?: string;
  sessionId?: string;
  message?: string;
  sender?: string;
};

export async function POST(req: NextRequest) {
  let body: WebhookBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const configuredToken = process.env.ADMIN_CHAT_WEBHOOK_TOKEN;
  if (!configuredToken) {
    return NextResponse.json({ error: "ADMIN_CHAT_WEBHOOK_TOKEN not configured" }, { status: 503 });
  }

  if (body.token !== configuredToken) {
    return NextResponse.json({ error: "Unauthorized token" }, { status: 401 });
  }

  const sessionId = (body.sessionId ?? "").trim();
  const message = (body.message ?? "").trim();
  if (!sessionId || !message) {
    return NextResponse.json({ error: "sessionId and message required" }, { status: 400 });
  }

  const sender = (body.sender ?? "Admin").trim();
  appendAdminChatMessage({
    sessionId,
    userId: null,
    role: "admin",
    text: `${sender}: ${message}`,
  });

  return NextResponse.json({ ok: true });
}
