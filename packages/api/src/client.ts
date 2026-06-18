import type { ApiResponse } from "@ryx/shared-types";

import { ApiError } from "./errors.js";

export interface ApiClientConfig {
  baseUrl: string;
  getAccessToken?: () => string | null | undefined;
  onUnauthorized?: () => void;
  fetchImpl?: typeof fetch;
}

export interface ApiClient {
  request<T>(path: string, init?: RequestInit): Promise<T>;
  get<T>(path: string, init?: RequestInit): Promise<T>;
  post<T>(path: string, body?: unknown, init?: RequestInit): Promise<T>;
  put<T>(path: string, body?: unknown, init?: RequestInit): Promise<T>;
  patch<T>(path: string, body?: unknown, init?: RequestInit): Promise<T>;
  delete<T>(path: string, init?: RequestInit): Promise<T>;
}

function buildUrl(baseUrl: string, path: string): string {
  const normalizedBase = baseUrl.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    "data" in value
  );
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  const fetchImpl = config.fetchImpl ?? globalThis.fetch.bind(globalThis);

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    const token = config.getAccessToken?.();

    if (!headers.has("Content-Type") && init.body !== undefined) {
      headers.set("Content-Type", "application/json");
    }

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetchImpl(buildUrl(config.baseUrl, path), {
      ...init,
      headers,
    });

    const contentType = response.headers.get("content-type") ?? "";
    const hasJsonBody = contentType.includes("application/json");
    const payload = hasJsonBody ? await response.json() : undefined;

    if (!response.ok) {
      if (response.status === 401) {
        config.onUnauthorized?.();
      }

      const message =
        typeof payload === "object" &&
        payload !== null &&
        "message" in payload &&
        typeof payload.message === "string"
          ? payload.message
          : `Request failed with status ${response.status}`;

      const code =
        typeof payload === "object" &&
        payload !== null &&
        "code" in payload &&
        typeof payload.code === "string"
          ? payload.code
          : undefined;

      throw new ApiError(message, response.status, code);
    }

    if (isApiResponse<T>(payload)) {
      if (!payload.success) {
        throw new ApiError(payload.message ?? "Request failed", response.status);
      }
      return payload.data;
    }

    return payload as T;
  }

  return {
    request,
    get<T>(path: string, init?: RequestInit) {
      return request<T>(path, { ...init, method: "GET" });
    },
    post<T>(path: string, body?: unknown, init?: RequestInit) {
      return request<T>(path, {
        ...init,
        method: "POST",
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    },
    put<T>(path: string, body?: unknown, init?: RequestInit) {
      return request<T>(path, {
        ...init,
        method: "PUT",
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    },
    patch<T>(path: string, body?: unknown, init?: RequestInit) {
      return request<T>(path, {
        ...init,
        method: "PATCH",
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    },
    delete<T>(path: string, init?: RequestInit) {
      return request<T>(path, { ...init, method: "DELETE" });
    },
  };
}
