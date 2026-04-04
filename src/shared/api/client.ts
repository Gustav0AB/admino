import { ENV } from "@/shared/config/env";
import { useAuthStore } from "@/shared/store/authStore";
import { ApiError } from "@/shared/types/api";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
};

export async function httpClient<T>(
  endpoint: string,
  options?: RequestOptions
): Promise<T> {
  const token = useAuthStore.getState().token;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options?.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${ENV.API_URL}${endpoint}`, {
    method: options?.method ?? "GET",
    headers,
    body: options?.body != null ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401) {
    useAuthStore.getState().logout();
    throw new ApiError(401, "Unauthorized");
  }

  if (response.status >= 500) {
    throw new ApiError(response.status, "Server error");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { message?: string };
    throw new ApiError(response.status, body.message ?? "Request failed");
  }

  return response.json() as Promise<T>;
}
