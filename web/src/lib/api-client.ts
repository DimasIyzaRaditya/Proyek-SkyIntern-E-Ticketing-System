import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { clearSession, getAuthToken, getRefreshToken, setAuthToken, setRefreshToken } from "@/lib/auth";

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

type RetriableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let refreshPromise: Promise<string | null> | null = null;

const requestAccessTokenRefresh = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post<{ token: string; refreshToken: string }>("/api/auth/refresh", { refreshToken })
      .then((response) => {
        setAuthToken(response.data.token);
        if (response.data.refreshToken) setRefreshToken(response.data.refreshToken);
        return response.data.token;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

export const getFreshAccessToken = async (): Promise<string | null> => {
  const token = getAuthToken();
  if (token) return token;
  return requestAccessTokenRefresh();
};

export const apiFetchWithAuth = async (input: RequestInfo | URL, init: RequestInit = {}) => {
  const send = (accessToken: string) => {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${accessToken}`);

    return fetch(input, {
      ...init,
      headers,
    });
  };

  const token = await getFreshAccessToken();
  if (!token) throw new Error("Sesi login tidak ditemukan. Silakan login kembali.");

  let response = await send(token);
  if (response.status !== 401) return response;

  const newToken = await requestAccessTokenRefresh();
  if (!newToken) {
    clearSession();
    return response;
  }

  response = await send(newToken);
  return response;
};

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorPayload>) => {
    const status = error.response?.status;
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (!originalRequest || status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    const newToken = await requestAccessTokenRefresh();
    if (!newToken) {
      clearSession();
      return Promise.reject(error);
    }

    originalRequest.headers = originalRequest.headers ?? {};
    originalRequest.headers.Authorization = `Bearer ${newToken}`;
    return api.request(originalRequest);
  }
);

const readErrorMessage = (error: AxiosError<ApiErrorPayload>) => {
  const payload = error.response?.data;
  if (payload?.message) return payload.message;
  return error.message || "Request failed";
};

export const apiRequest = async <T>(path: string, options: ApiRequestOptions = {}): Promise<T> => {
  if (options.auth) {
    const token = await getFreshAccessToken();
    if (!token) {
      throw new Error("Sesi login tidak ditemukan. Silakan login kembali.");
    }
  }

  try {
    const response = await api.request<T>({
      url: path,
      method: options.method ?? "GET",
      headers: options.headers,
      data: options.body,
    });

    return response.data as T;
  } catch (err) {
    const error = err as AxiosError<ApiErrorPayload>;
    const message = readErrorMessage(error);

    if (error.response?.status === 403 && message === "Akun Anda telah diblokir oleh admin.") {
      if (typeof window !== "undefined") {
        clearSession();
        window.location.href = "/auth/login?blocked=1";
      }
    }

    throw new Error(message);
  }
};
