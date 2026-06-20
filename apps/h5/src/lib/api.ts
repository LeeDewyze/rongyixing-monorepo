import { createApi } from "@ryx/api";
import { createDefaultMockHandler } from "@ryx/mock";

import { getApiBaseUrl, getApiMode, getAppId, getMockDelay } from "@/lib/env";
import {
  getRequestDomain,
  getRequestExtraFields,
  getRequestLanguage,
  getTicketName,
} from "@/lib/request-context";
import { clearSession, getTicket } from "@/lib/session";

const API_CONFIG_STORAGE_KEY = "ryx_api_config";

let apiInstance: ReturnType<typeof createApi> | null = null;

/** Route cross-origin login URLs through Vite dev proxy (e.g. /Jyx/LoginByRyx). */
function rewriteDevProxyUrl(url: string): string {
  if (!import.meta.env.DEV) {
    return url;
  }
  try {
    const { pathname } = new URL(url);
    if (pathname.startsWith("/Jyx")) {
      return pathname;
    }
  } catch {
    // relative paths pass through
  }
  return url;
}

/** Clear cached `/Home/Setting` payload (Token, Urls, LoginUrl). */
export function clearApiConfigCache(): void {
  try {
    localStorage.removeItem(API_CONFIG_STORAGE_KEY);
  } catch {
    // ignore quota / SSR
  }
}

/** Lazily create the shared API client for this app. */
export function getApi() {
  if (!apiInstance) {
    const mode = getApiMode();
    apiInstance = createApi({
      baseUrl: getApiBaseUrl(),
      mode,
      appId: getAppId(),
      mockDelay: mode === "mock" ? getMockDelay() : 0,
      mockHandler: mode === "mock" ? createDefaultMockHandler() : undefined,
      getTicket,
      getTicketName,
      getDomain: getRequestDomain,
      getLanguage: getRequestLanguage,
      getExtraFields: getRequestExtraFields,
      getAccessToken: () => localStorage.getItem("accessToken"),
      rewriteUrl: rewriteDevProxyUrl,
      onUnauthorized: () => {
        clearSession();
      },
    });
  }

  return apiInstance;
}

/** Fetch Token + Urls from GET /Home/Setting before first signed request. */
export async function bootstrapApi(): Promise<void> {
  if (getApiMode() === "mock") {
    return;
  }
  try {
    const api = getApi();
    await api.proxy.loadApiConfig();
  } catch (error) {
    console.error("[ryx] bootstrap: failed to load ApiConfig, Sign may fail", error);
    // Do not throw — allow app to render; ensureApiConfig retries on first request.
  }
}

/** Reset cached client (e.g. after switching API mode). */
export function resetApi(): void {
  apiInstance = null;
  clearApiConfigCache();
}
