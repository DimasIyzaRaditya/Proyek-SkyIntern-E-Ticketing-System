import { apiRequest } from "@/lib/api-client";
import type { UserSession } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/api-client";

type AuthLoginResponse = {
  message: string;
  token?: string;
  requiresTwoFactor?: boolean;
  twoFactorToken?: string;
};

type AuthVerifyTwoFactorResponse = {
  message: string;
  token: string;
};

type AuthProfileResponse = {
  user: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    nik: string | null;
    dateOfBirth: string | null;
    avatarUrl: string | null;
    twoFactorEnabled: boolean;
    role: "ADMIN" | "USER";
  };
};

export type AuthSessionPayload = {
  token: string;
  user: UserSession;
};

export type AuthPendingTwoFactorPayload = {
  requiresTwoFactor: true;
  twoFactorToken: string;
};

export type AuthLoginResult = AuthSessionPayload | AuthPendingTwoFactorPayload;

const normalizeAvatarUrl = (url: string | null): string => {
  const raw = (url ?? "").trim();
  if (!raw) return "";

  const avatarUri = UriTryParse(raw);
  if (!avatarUri) return raw;

  const apiUri = UriTryParse(API_BASE_URL);
  if (!apiUri) return raw;

  const host = avatarUri.hostname.toLowerCase();
  const shouldReplaceHost = host === "localhost" || host === "127.0.0.1" || host === "10.0.2.2";
  if (!shouldReplaceHost) return raw;

  avatarUri.host = apiUri.hostname;
  return avatarUri.toString();
};

const UriTryParse = (value: string): URL | null => {
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

const toUserSession = (user: AuthProfileResponse["user"]): UserSession => ({
  id: user.id,
  fullName: user.name,
  email: user.email,
  phoneNumber: user.phone ?? "",
  nik: user.nik ?? "",
  dateOfBirth: user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : "",
  avatarUrl: normalizeAvatarUrl(user.avatarUrl),
  twoFactorEnabled: user.twoFactorEnabled,
  role: user.role === "ADMIN" ? "admin" : "user",
});

export const registerWithApi = async (payload: { name: string; email: string; password: string }) => {
  await apiRequest<{ message: string; user: { id: number } }>("/api/auth/register", {
    method: "POST",
    body: payload,
  });
};

export const loginWithApi = async (payload: { email: string; password: string }): Promise<AuthLoginResult> => {
  const loginResponse = await apiRequest<AuthLoginResponse>("/api/auth/login", {
    method: "POST",
    body: payload,
  });

  if (loginResponse.requiresTwoFactor) {
    if (!loginResponse.twoFactorToken) {
      throw new Error("Token verifikasi 2FA tidak tersedia.");
    }

    return {
      requiresTwoFactor: true,
      twoFactorToken: loginResponse.twoFactorToken,
    };
  }

  if (!loginResponse.token) {
    throw new Error("Token login tidak tersedia.");
  }

  const profileResponse = await apiRequest<AuthProfileResponse>("/api/auth/profile", {
    headers: {
      Authorization: `Bearer ${loginResponse.token}`,
    },
  });

  return {
    token: loginResponse.token,
    user: toUserSession(profileResponse.user),
  };
};

export const verifyTwoFactorLoginWithApi = async (payload: { twoFactorToken: string; code: string }): Promise<AuthSessionPayload> => {
  const verifyResponse = await apiRequest<AuthVerifyTwoFactorResponse>("/api/auth/login/2fa/verify", {
    method: "POST",
    body: payload,
  });

  const profileResponse = await apiRequest<AuthProfileResponse>("/api/auth/profile", {
    headers: {
      Authorization: `Bearer ${verifyResponse.token}`,
    },
  });

  return {
    token: verifyResponse.token,
    user: toUserSession(profileResponse.user),
  };
};

export const resendTwoFactorCodeFromApi = async (payload: { twoFactorToken: string }) => {
  return apiRequest<{ message: string }>("/api/auth/login/2fa/resend", {
    method: "POST",
    body: payload,
  });
};

export const getProfileFromApi = async (): Promise<UserSession> => {
  const payload = await apiRequest<AuthProfileResponse>("/api/auth/profile", { auth: true });
  return toUserSession(payload.user);
};

export const updateProfileFromApi = async (payload: {
  name?: string;
  phone?: string;
  nik?: string | null;
  dateOfBirth?: string | null;
  avatarUrl?: string | null;
}): Promise<UserSession> => {
  const response = await apiRequest<AuthProfileResponse & { message: string }>("/api/auth/profile", {
    method: "PUT",
    auth: true,
    body: payload,
  });
  return toUserSession(response.user);
};

export const updateTwoFactorSettingFromApi = async (payload: { enabled: boolean }): Promise<UserSession> => {
  const response = await apiRequest<AuthProfileResponse & { message: string }>("/api/auth/2fa", {
    method: "PUT",
    auth: true,
    body: payload,
  });

  return toUserSession(response.user);
};

export const uploadAvatarToApi = async (file: File): Promise<UserSession> => {
  const { getAuthToken } = await import("@/lib/auth");
  const { API_BASE_URL } = await import("@/lib/api-client");
  const token = getAuthToken();
  if (!token) throw new Error("Sesi login tidak ditemukan. Silakan login kembali.");

  const formData = new FormData();
  formData.append("avatar", file);

  const res = await fetch(`${API_BASE_URL}/api/auth/avatar`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message ?? "Gagal mengupload foto profil.");
  }

  const data = (await res.json()) as AuthProfileResponse & { message: string };
  return toUserSession(data.user);
};

export const forgotPasswordFromApi = async (payload: { email: string }) => {
  return apiRequest<{ message: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: payload,
  });
};

export const resetPasswordFromApi = async (payload: { resetToken: string; newPassword: string }) => {
  return apiRequest<{ message: string }>("/api/auth/reset-password", {
    method: "POST",
    body: payload,
  });
};
