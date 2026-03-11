import { apiRequest } from "@/lib/api-client";
import type { UserSession } from "@/lib/auth";

type AuthLoginResponse = {
  message: string;
  token: string;
};

type AuthProfileResponse = {
  user: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
    role: "ADMIN" | "USER";
  };
};

export type AuthSessionPayload = {
  token: string;
  user: UserSession;
};

const toUserSession = (user: AuthProfileResponse["user"]): UserSession => ({
  id: user.id,
  fullName: user.name,
  email: user.email,
  phoneNumber: user.phone ?? "",
  avatarUrl: user.avatarUrl ?? "",
  role: user.role === "ADMIN" ? "admin" : "user",
});

export const registerWithApi = async (payload: { name: string; email: string; password: string }) => {
  await apiRequest<{ message: string; user: { id: number } }>("/api/auth/register", {
    method: "POST",
    body: payload,
  });
};

export const loginWithApi = async (payload: { email: string; password: string }): Promise<AuthSessionPayload> => {
  const loginResponse = await apiRequest<AuthLoginResponse>("/api/auth/login", {
    method: "POST",
    body: payload,
  });

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

export const getProfileFromApi = async (): Promise<UserSession> => {
  const payload = await apiRequest<AuthProfileResponse>("/api/auth/profile", { auth: true });
  return toUserSession(payload.user);
};

export const updateProfileFromApi = async (payload: { name?: string; phone?: string; avatarUrl?: string | null }): Promise<UserSession> => {
  const response = await apiRequest<AuthProfileResponse & { message: string }>("/api/auth/profile", {
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
