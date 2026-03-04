import { getAuthToken } from "@/lib/auth";

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  auth?: boolean;
  body?: unknown;
  headers?: Record<string, string>;
  cache?: RequestCache;
};

type ApiErrorPayload = {
  message?: string;
};

const readErrorMessage = async (response: Response) => {
  try {
    const payload = (await response.json()) as ApiErrorPayload;
    if (payload?.message) return payload.message;
  } catch {
    return response.statusText || "Request failed";
  }

  return response.statusText || "Request failed";
};

export const apiRequest = async <T>(path: string, options: ApiRequestOptions = {}): Promise<T> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  };

  if (options.auth) {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Sesi login tidak ditemukan. Silakan login kembali.");
    }

    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: options.cache ?? "no-store",
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};
