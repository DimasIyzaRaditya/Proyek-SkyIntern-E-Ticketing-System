"use client";

import { useEffect, useRef, useState } from "react";
import { getUserSession } from "@/lib/auth";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  Minimize2,
  Maximize2,
  ChevronDown,
} from "lucide-react";

//    Types

type Role = "bot" | "user";

interface Message {
  id: number;
  role: Role;
  text: string;
  time: string;
}

interface QuickReply {
  label: string;
  value: string;
}


//    Knowledge base

const FAQ: Array<{ keywords: string[]; answer: string }> = [
  {
    keywords: ["halo", "hai", "hi", "hello", "hey", "selamat"],
    answer:
      "Halo! 👋 Selamat datang di **SkyIntern E-Ticketing**. Ada yang bisa saya bantu hari ini?",
  },
  {
    keywords: ["apa", "tentang", "aplikasi", "skyintern", "e-ticketing", "sistem"],
    answer:
      "**SkyIntern E-Ticketing** adalah platform pemesanan tiket pesawat online yang memudahkan kamu mencari penerbangan, memesan tiket, dan melakukan pembayaran — semuanya dalam satu tempat! ✈️",
  },
  {
    keywords: ["cari", "search", "penerbangan", "flight", "tiket"],
    answer:
      "Untuk mencari penerbangan:\n1. Buka halaman **Search Flights** di menu atas.\n2. Isi kota asal, tujuan, tanggal, dan jumlah penumpang.\n3. Klik **Cari Penerbangan** dan pilih jadwal yang sesuai. 🔍",
  },
  {
    keywords: ["pesan", "booking", "beli", "order"],
    answer:
      "Cara memesan tiket:\n1. Pilih penerbangan yang diinginkan.\n2. Isi data penumpang lengkap.\n3. Pilih kursi.\n4. Lanjutkan ke pembayaran. 🎫",
  },
  {
    keywords: ["bayar", "payment", "pembayaran", "midtrans", "transfer", "kartu"],
    answer:
      "Pembayaran dilakukan melalui **Midtrans** yang mendukung berbagai metode:\n• Transfer bank\n• Kartu kredit / debit\n• E-wallet (GoPay, OVO, DANA, dll)\n• QRIS\n\nSetelah pembayaran berhasil, e-tiket akan dikirim ke email kamu. 💳",
  },
  {
    keywords: ["cek", "status", "riwayat", "history", "bookings", "pesanan"],
    answer:
      "Kamu bisa melihat status pemesanan di halaman **Bookings** pada menu navigasi atas. Di sana tersedia riwayat lengkap dan status terkini tiketmu. 📋",
  },
  {
    keywords: ["promo", "diskon", "voucher", "kode", "potongan"],
    answer:
      "Promo tersedia di halaman utama dan halaman pencarian. Masukkan **kode promo** saat checkout untuk mendapat diskon spesial! 🎉 Pantau terus halaman Search untuk penawaran terbaru.",
  },
  {
    keywords: ["daftar", "register", "akun", "buat", "sign up"],
    answer:
      "Untuk mendaftar:\n1. Klik **Login / Register** di pojok kanan atas.\n2. Pilih tab **Register**.\n3. Isi nama, email, dan kata sandi.\n4. Verifikasi email, selesai! ✅",
  },
  {
    keywords: ["login", "masuk", "sign in", "password", "lupa"],
    answer:
      "Klik tombol **Login** di menu navigasi, masukkan email dan kata sandi kamu. Jika lupa password, gunakan fitur **Lupa Password** yang tersedia di halaman login. 🔐",
  },
  {
    keywords: ["kursi", "seat", "tempat duduk", "pilih"],
    answer:
      "Kamu bisa memilih kursi saat proses pemesanan. Peta kursi pesawat akan ditampilkan — pilih yang tersedia (berwarna hijau) sesuai preferensimu. 💺",
  },
  {
    keywords: ["admin", "dashboard", "kelola", "manage"],
    answer:
      "Fitur **Admin Dashboard** dikhususkan untuk pengelola sistem. Admin dapat mengelola penerbangan, bandara, maskapai, pengguna, dan melihat laporan pemesanan. 🛠️",
  },
  {
    keywords: ["kontak", "bantuan", "help", "support", "hubungi"],
    answer:
      "Butuh bantuan lebih lanjut? Hubungi tim kami:\n📧 **support@skyintern.id**\n📞 **0800-SKY-HELP**\n\nAtau sampaikan melalui formulir kontak di halaman profil. 🙏",
  },
  {
    keywords: ["e-tiket", "tiket", "download", "pdf", "qr", "boarding"],
    answer:
      "Setelah pembayaran berhasil, e-tiket akan tampil di halaman **Bookings**. Kamu bisa melihat **QR Code** tiket sebagai bukti pemesanan yang dapat ditunjukkan saat check-in. 📱",
  },
  {
    keywords: ["cancel", "batal", "refund", "kembali", "uang"],
    answer:
      "Untuk pembatalan tiket, silakan hubungi support kami di **support@skyintern.id** dengan menyertakan kode booking. Kebijakan refund mengikuti ketentuan maskapai yang bersangkutan. ℹ️",
  },
];

const QUICK_REPLIES: QuickReply[] = [
  { label: "Cara pesan tiket", value: "Bagaimana cara memesan tiket?" },
  { label: "Metode pembayaran", value: "Apa saja metode pembayaran?" },
  { label: "Cek status booking", value: "Bagaimana cara cek status pesanan saya?" },
  { label: "Tentang aplikasi", value: "Apa itu SkyIntern E-Ticketing?" },
  { label: "Info promo", value: "Ada promo apa saja?" },
  { label: "Hubungi support", value: "Bagaimana cara hubungi support?" },
];


//    Helper

function getBotAnswer(input: string): string {
  const lower = ` ${input.toLowerCase()} `; // pad to allow boundary match at start/end
  for (const faq of FAQ) {
    // Use word boundary: keyword must be surrounded by non-word chars
    if (faq.keywords.some((kw) => {
      const pattern = new RegExp(`(?<![a-z])${kw}(?![a-z])`, "i");
      return pattern.test(lower);
    })) {
      return faq.answer;
    }
  }
  return "";
}

function now(): string {
  return new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

/* ─────────────────────────────────────────────
   Per-user chat persistence
───────────────────────────────────────────── */
const CHAT_KEY_PREFIX = "skyintern_chat_";

function makeInitialMessage(): Message {
  return {
    id: 1,
    role: "bot",
    text: "Halo! 👋 Saya **Sky Assistant**, asisten virtual SkyIntern E-Ticketing.\n\nAda yang ingin kamu tanyakan tentang pemesanan tiket pesawat? Silakan ketik pertanyaanmu atau pilih topik di bawah ini!",
    time: now(),
  };
}

function loadMessagesForUser(userId: number | null): Message[] {
  if (!userId) return [makeInitialMessage()];
  try {
    const raw = localStorage.getItem(`${CHAT_KEY_PREFIX}${userId}`);
    if (!raw) return [makeInitialMessage()];
    const parsed = JSON.parse(raw) as Message[];
    return parsed.length > 0 ? parsed : [makeInitialMessage()];
  } catch {
    return [makeInitialMessage()];
  }
}

function saveMessagesForUser(userId: number | null, msgs: Message[]) {
  if (!userId || typeof window === "undefined") return;
  localStorage.setItem(`${CHAT_KEY_PREFIX}${userId}`, JSON.stringify(msgs));
}

function formatText(text: string): React.ReactNode[] {
  return text.split("\n").map((line, i) => {
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <span key={i}>
        {parts.map((part, j) =>
          j % 2 === 1 ? <strong key={j}>{part}</strong> : part
        )}
        {i < text.split("\n").length - 1 && <br />}
      </span>
    );
  });
}


//    Bubble

function Bubble({ msg }: { msg: Message }) {
  const isBot = msg.role === "bot";
  return (
    <div className={`flex items-end gap-2 ${isBot ? "justify-start" : "justify-end"}`}>
      {isBot && (
        <div className="w-7 h-7 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow">
          <Bot size={14} className="text-white" />
        </div>
      )}
      <div className={`max-w-[78%] ${isBot ? "" : "items-end flex flex-col"}`}>
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
            isBot
              ? "bg-white text-slate-800 rounded-tl-sm border border-slate-100"
              : "bg-linear-to-br from-blue-500 to-indigo-600 text-white rounded-tr-sm"
          }`}
        >
          {formatText(msg.text)}
        </div>
        <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>
      </div>
    </div>
  );
}


//    Typing indicator
function Typing() {
  return (
    <div className="flex items-end gap-2 justify-start">
      <div className="w-7 h-7 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow">
        <Bot size={14} className="text-white" />
      </div>
      <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
        <div className="flex gap-1 items-center h-4">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}


//    Main ChatBot

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);

  /* Lazy init: load messages from localStorage for the current logged-in user */
  const [init] = useState(() => {
    if (typeof window === "undefined") {
      return { userId: null as number | null, messages: [makeInitialMessage()], nextId: 2 };
    }
    const userId = getUserSession()?.id ?? null;
    const msgs = loadMessagesForUser(userId);
    return {
      userId,
      messages: msgs,
      nextId: msgs.length > 0 ? Math.max(...msgs.map((m) => m.id)) + 1 : 2,
    };
  });

  /* Track the current user in a ref so event handlers always see the latest value */
  const currentUserIdRef = useRef<number | null>(init.userId);
  const [messages, setMessages] = useState<Message[]>(init.messages);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const idRef = useRef(init.nextId);

  /* Persist messages for the current user whenever they change */
  useEffect(() => {
    saveMessagesForUser(currentUserIdRef.current, messages);
  }, [messages]);

  /* Detect account switch — cross-tab (storage event) & same-tab (focus / visibilitychange) */
  useEffect(() => {
    const resetForUser = (userId: number | null) => {
      currentUserIdRef.current = userId;
      const freshMsgs = loadMessagesForUser(userId);
      setMessages(freshMsgs);
      idRef.current =
        freshMsgs.length > 0 ? Math.max(...freshMsgs.map((m) => m.id)) + 1 : 2;
      setUnread(0);
      setTyping(false);
    };

    const checkSession = () => {
      const newId = getUserSession()?.id ?? null;
      if (newId !== currentUserIdRef.current) resetForUser(newId);
    };

    const handleStorage = (e: StorageEvent) => {
      if (
        e.key === "skyintern_session" ||
        e.key === "skybook_session" ||
        e.key === null
      ) {
        checkSession();
      }
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") checkSession();
    };

    window.addEventListener("storage", handleStorage);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", checkSession);

    return () => {
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", checkSession);
    };
  }, []); // refs & module-level fns only — no deps needed

  /* scroll to bottom */
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (open && !minimized) {
      scrollToBottom();
    }
  }, [messages, open, minimized]);

  /* detect scroll */
  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setShowScrollBtn(!nearBottom);
  };

  /* send message — calls /api/chat (OpenAI), falls back to local FAQ */
  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: idRef.current++,
      role: "user",
      text: text.trim(),
      time: now(),
    };

    // Capture snapshot of messages BEFORE state update for the API payload
    const historySnapshot = messages;

    setMessages((p) => [...p, userMsg]);
    setInput("");
    setTyping(true);

    let answer: string;
    let isAiError = false;

    try {
      // Build conversation history for the AI (bot→assistant, user→user)
      const apiMessages = [
        ...historySnapshot.map((m) => ({
          role: m.role === "bot" ? "assistant" : "user",
          content: m.text,
        })),
        { role: "user", content: text.trim() },
      ];

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (res.ok) {
        const data = await res.json();
        answer = data.reply || "Maaf, AI tidak memberikan respons. Coba lagi. 🙏";
      } else if (res.status === 503) {
        isAiError = true;
        answer = "⚠️ **AI belum aktif** — `GROQ_API_KEY` belum diisi di `.env.local`. Isi key dari console.groq.com lalu restart server.";
      } else if (res.status === 429) {
        isAiError = true;
        answer = "⚠️ **Terlalu banyak permintaan ke AI.** Silakan tunggu beberapa saat lalu coba lagi. 🙏";
      } else if (res.status === 400 || res.status === 401 || res.status === 403) {
        isAiError = true;
        answer = "⚠️ **API Key tidak valid.** Pastikan `GROQ_API_KEY` sudah benar di `.env.local`, lalu restart server.";
      } else {
        isAiError = true;
        let detail = "";
        try {
          const errData = await res.json();
          detail = errData.detail ? ` — ${errData.detail}` : "";
        } catch { /* ignore */ }
        answer = `⚠️ **Terjadi error saat menghubungi AI** (HTTP ${res.status})${detail}. Silakan coba lagi.`;
      }
    } catch {
      isAiError = true;
      answer = "⚠️ **Tidak bisa terhubung ke server AI.** Pastikan dev server (`npm run dev`) sudah berjalan dan coba lagi.";
    }

    // When AI fails and we have a specific error message already set, keep it.
    // But if the question matches a FAQ entry exactly, prefer that as fallback.
    if (isAiError) {
      const faqAnswer = getBotAnswer(text);
      if (faqAnswer) answer = faqAnswer; // only use FAQ when there's a real match
    }

    const botMsg: Message = {
      id: idRef.current++,
      role: "bot",
      text: answer,
      time: now(),
    };
    setTyping(false);
    setMessages((p) => [...p, botMsg]);
    if (!open || minimized) setUnread((u) => u + 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  const handleOpen = () => {
    setOpen(true);
    setMinimized(false);
    setUnread(0);
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  return (
    <>
      {/* ── Floating button ── */}
      {!open && (
        <button
          onClick={handleOpen}
          aria-label="Buka chatbot"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 text-white shadow-xl shadow-blue-500/40 flex items-center justify-center hover:scale-110 transition-transform duration-200 active:scale-95"
        >
          <MessageCircle size={25} />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      )}

      {/* ── Chat window ── */}
      {open && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex flex-col bg-white rounded-2xl shadow-2xl shadow-slate-400/30 border border-slate-200 transition-all duration-300 ease-out
            ${minimized ? "h-14 w-72" : "w-85 sm:w-95 h-140 sm:h-150"}
          `}
          style={{ maxHeight: "calc(100dvh - 32px)", maxWidth: "calc(100vw - 24px)" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-linear-to-r from-blue-500 to-indigo-600 rounded-t-2xl text-white shrink-0">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Bot size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight">Sky Assistant</p>
              <p className="text-[11px] text-blue-100 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                Online • Siap membantu
              </p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  setMinimized((m) => {
                    if (m) setUnread(0); // unminimizing → clear badge
                    return !m;
                  });
                }}
                className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label={minimized ? "Perbesar" : "Perkecil"}
              >
                {minimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Tutup chat"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div
                ref={listRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50"
              >
                {messages.map((msg) => (
                  <Bubble key={msg.id} msg={msg} />
                ))}
                {typing && <Typing />}
                <div ref={bottomRef} />
              </div>

              {/* Scroll to bottom */}
              {showScrollBtn && (
                <button
                  onClick={() => scrollToBottom()}
                  className="absolute bottom-27 right-4 w-8 h-8 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors z-10"
                >
                  <ChevronDown size={16} />
                </button>
              )}

              {/* Quick replies */}
              <div className="shrink-0 px-3 py-2 bg-white border-t border-slate-100">
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  {QUICK_REPLIES.map((qr) => (
                    <button
                      key={qr.value}
                      onClick={() => void sendMessage(qr.value)}
                      className="shrink-0 text-[11px] px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors whitespace-nowrap"
                    >
                      {qr.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input */}
              <form
                onSubmit={handleSubmit}
                className="shrink-0 flex items-center gap-2 px-3 pb-3 pt-1 bg-white rounded-b-2xl"
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ketik pertanyaanmu…"
                  className="flex-1 h-10 px-4 rounded-full bg-slate-100 text-sm text-slate-800 placeholder:text-slate-400 border border-transparent focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-transform"
                  aria-label="Kirim pesan"
                >
                  <Send size={15} />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
