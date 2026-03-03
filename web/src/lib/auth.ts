export type RegisteredUser = {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
};

export type UserSession = {
  fullName: string;
  email: string;
};

const REGISTERED_USER_KEY = "skyintern_registered_user";
const SESSION_KEY = "skyintern_session";
const ROLE_KEY = "skyintern_role";

const LEGACY_REGISTERED_USER_KEY = "skybook_registered_user";
const LEGACY_SESSION_KEY = "skybook_session";
const LEGACY_ROLE_KEY = "skybook_role";

const readWithLegacyFallback = (key: string, legacyKey: string) => {
  const nextValue = window.localStorage.getItem(key);
  if (nextValue) return nextValue;
  return window.localStorage.getItem(legacyKey);
};

export const getRegisteredUser = (): RegisteredUser | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = readWithLegacyFallback(REGISTERED_USER_KEY, LEGACY_REGISTERED_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RegisteredUser;
  } catch {
    return null;
  }
};

export const saveRegisteredUser = (user: RegisteredUser) => {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify(user);
  window.localStorage.setItem(REGISTERED_USER_KEY, payload);
  window.localStorage.setItem(LEGACY_REGISTERED_USER_KEY, payload);
};

export const setUserSession = (session: UserSession) => {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify(session);
  window.localStorage.setItem(SESSION_KEY, payload);
  window.localStorage.setItem(LEGACY_SESSION_KEY, payload);
  window.localStorage.setItem(ROLE_KEY, "user");
  window.localStorage.setItem(LEGACY_ROLE_KEY, "user");
};

export const setAdminSession = () => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ROLE_KEY, "admin");
  window.localStorage.setItem(LEGACY_ROLE_KEY, "admin");
};

export const clearSession = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem(LEGACY_SESSION_KEY);
  window.localStorage.removeItem(ROLE_KEY);
  window.localStorage.removeItem(LEGACY_ROLE_KEY);
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
  const role = getRole();
  return role === "user" || role === "admin";
};
