export type AdminChatMessage = {
  id: number;
  role: "user" | "admin";
  text: string;
  timestamp: number;
};

type AdminChatSession = {
  sessionId: string;
  userId: number | null;
  messages: AdminChatMessage[];
  updatedAt: number;
};

type AdminChatStore = {
  sessions: Map<string, AdminChatSession>;
  sequence: number;
};

const STORE_KEY = "__skyintern_admin_chat_store__";

const getStore = (): AdminChatStore => {
  const globalScope = globalThis as typeof globalThis & {
    [STORE_KEY]?: AdminChatStore;
  };

  if (!globalScope[STORE_KEY]) {
    globalScope[STORE_KEY] = {
      sessions: new Map<string, AdminChatSession>(),
      sequence: 1,
    };
  }

  return globalScope[STORE_KEY] as AdminChatStore;
};

const sanitizeText = (value: string) => value.trim().slice(0, 2000);

export const ensureAdminChatSession = (sessionId: string, userId: number | null) => {
  const store = getStore();
  const existing = store.sessions.get(sessionId);
  if (existing) {
    if (existing.userId === null && userId !== null) {
      existing.userId = userId;
    }
    existing.updatedAt = Date.now();
    return existing;
  }

  const created: AdminChatSession = {
    sessionId,
    userId,
    messages: [],
    updatedAt: Date.now(),
  };
  store.sessions.set(sessionId, created);
  return created;
};

export const appendAdminChatMessage = (params: {
  sessionId: string;
  userId: number | null;
  role: "user" | "admin";
  text: string;
}) => {
  const store = getStore();
  const session = ensureAdminChatSession(params.sessionId, params.userId);
  const text = sanitizeText(params.text);
  if (!text) return null;

  const message: AdminChatMessage = {
    id: store.sequence++,
    role: params.role,
    text,
    timestamp: Date.now(),
  };

  session.messages.push(message);
  session.updatedAt = Date.now();
  return message;
};

export const getAdminMessagesSince = (sessionId: string, afterId: number) => {
  const store = getStore();
  const session = store.sessions.get(sessionId);
  if (!session) return [];

  return session.messages.filter((message) => message.role === "admin" && message.id > afterId);
};
