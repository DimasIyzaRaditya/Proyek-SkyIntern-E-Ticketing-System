import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `Kamu adalah Sky Assistant, asisten AI pintar dari SkyIntern E-Ticketing.

Kamu bisa menjawab pertanyaan apapun seperti asisten AI pada umumnya -- mulai dari pertanyaan umum, sains, teknologi, bahasa, matematika, sejarah, budaya, hingga hal sehari-hari.

Selain itu, kamu juga ahli dalam membantu pengguna seputar platform SkyIntern E-Ticketing:
- Mencari dan memesan tiket pesawat
- Pembayaran via Midtrans (transfer bank, kartu kredit/debit, e-wallet GoPay/OVO/DANA, QRIS)
- Cek status dan riwayat pemesanan di halaman Bookings
- Pemilihan kursi saat pemesanan
- Promo dan diskon
- Daftar akun, login, dan profil
- E-tiket dan QR Code boarding
- Kebijakan pembatalan (hubungi support@skyintern.id)
- Fitur Admin Dashboard untuk pengelola sistem

Aturan menjawab:
- Gunakan Bahasa Indonesia yang natural, ramah, dan mudah dipahami
- Untuk jawaban pendek, langsung ke poin; untuk topik kompleks boleh lebih detail
- Gunakan emoji sesekali agar percakapan terasa hidup
- Jangan buat informasi harga atau jadwal penerbangan fiktif; arahkan ke halaman Search Flights
- Kontak support SkyIntern: support@skyintern.id`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "GROQ_API_KEY not configured" },
      { status: 503 }
    );
  }

  let body: { messages?: Array<{ role: string; content: string }> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const userMessages = body.messages;
  if (!Array.isArray(userMessages) || userMessages.length === 0) {
    return NextResponse.json({ error: "messages required" }, { status: 400 });
  }

  const safeMessages = userMessages
    .filter(
      (m): m is { role: "user" | "assistant"; content: string } =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0
    )
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...safeMessages],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[chat/route] Groq error:", response.status, errText);
      let parsed: { error?: { message?: string } } = {};
      try { parsed = JSON.parse(errText); } catch { /* ignore */ }
      const detail = parsed?.error?.message ?? errText.slice(0, 200);

      if (response.status === 429) {
        return NextResponse.json({ error: "rate_limit", detail }, { status: 429 });
      }
      return NextResponse.json(
        { error: "AI service error", detail },
        { status: 502 }
      );
    }

    const data = await response.json();
    const reply: string = data.choices?.[0]?.message?.content?.trim() ?? "";

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[chat/route] fetch error:", err);
    return NextResponse.json({ error: "Network error" }, { status: 502 });
  }
}