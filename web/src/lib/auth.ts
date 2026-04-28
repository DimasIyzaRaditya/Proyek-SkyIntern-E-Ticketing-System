export type UserSession = {
  id: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  nik?: string;
  dateOfBirth?: string;
  avatarUrl?: string;
  twoFactorEnabled?: boolean;
  role: "user" | "admin";
};

const SESSION_KEY = "skyintern_session";
const ROLE_KEY = "skyintern_role";
const TOKEN_KEY = "skyintern_token";
const REFRESH_TOKEN_KEY = "skyintern_refresh_token";

const LEGACY_SESSION_KEY = "skybook_session";
const LEGACY_ROLE_KEY = "skybook_role";
const LEGACY_TOKEN_KEY = "skybook_token";
const LEGACY_REFRESH_TOKEN_KEY = "skybook_refresh_token";

const readWithLegacyFallback = (key: string, legacyKey: string) => {
  const nextValue = window.localStorage.getItem(key);
  if (nextValue) return nextValue;
  return window.localStorage.getItem(legacyKey);
};

export const setUserSession = (session: UserSession, token?: string, refreshToken?: string) => {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify(session);
  window.localStorage.setItem(SESSION_KEY, payload);
  window.localStorage.setItem(LEGACY_SESSION_KEY, payload);
  window.localStorage.setItem(ROLE_KEY, session.role);
  window.localStorage.setItem(LEGACY_ROLE_KEY, session.role);

  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token);
    window.localStorage.setItem(LEGACY_TOKEN_KEY, token);
  }

  if (refreshToken) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    window.localStorage.setItem(LEGACY_REFRESH_TOKEN_KEY, refreshToken);
  }
};

export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return readWithLegacyFallback(TOKEN_KEY, LEGACY_TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return readWithLegacyFallback(REFRESH_TOKEN_KEY, LEGACY_REFRESH_TOKEN_KEY);
};

export const setAuthToken = (token: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(LEGACY_TOKEN_KEY, token);
};

export const setRefreshToken = (token: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
  window.localStorage.setItem(LEGACY_REFRESH_TOKEN_KEY, token);
};

export const clearSession = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem(LEGACY_SESSION_KEY);
  window.localStorage.removeItem(ROLE_KEY);
  window.localStorage.removeItem(LEGACY_ROLE_KEY);
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(LEGACY_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
};

export const getUserSession = (): UserSession | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = readWithLegacyFallback(SESSION_KEY, LEGACY_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserSession;
  } catch {
    return null;
  }
};

export const getRole = (): string | null => {
  if (typeof window === "undefined") return null;
  return readWithLegacyFallback(ROLE_KEY, LEGACY_ROLE_KEY);
};

export const isAuthenticated = () => {
  return Boolean(getAuthToken() && getUserSession());
};
