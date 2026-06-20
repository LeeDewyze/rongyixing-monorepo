import { createApi } from "@ryx/api";
import { createDefaultMockHandler } from "@ryx/mock";

import { getApiBaseUrl, getApiMode, getMockDelay, getStaticApiConfig } from "@/lib/env";
import {
  getRequestDomain,
  getRequestExtraFields,
  getRequestLanguage,
  getTicketName,
} from "@/lib/request-context";
import { clearSession, getTicket } from "@/lib/session";

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

/** Lazily create the shared API client for this app. */
export function getApi() {
  if (!apiInstance) {
    const mode = getApiMode();
    apiInstance = createApi({
      baseUrl: getApiBaseUrl(),
      mode,
      apiConfig: getStaticApiConfig(),
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

/** Reset cached client (e.g. after switching API mode). */
export function resetApi(): void {
  apiInstance = null;
}
