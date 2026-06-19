import { createApi } from "@ryx/api";
import { createDefaultMockHandler } from "@ryx/mock";

import { getApiBaseUrl, getApiMode, getMockDelay } from "@/lib/env";
import { clearSession, getTicket } from "@/lib/session";

let apiInstance: ReturnType<typeof createApi> | null = null;

/** Lazily create the shared API client for this app. */
export function getApi() {
  if (!apiInstance) {
    const mode = getApiMode();
    apiInstance = createApi({
      baseUrl: getApiBaseUrl(),
      mode,
      mockDelay: mode === "mock" ? getMockDelay() : 0,
      mockHandler: mode === "mock" ? createDefaultMockHandler() : undefined,
      getTicket,
      getAccessToken: () => localStorage.getItem("accessToken"),
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
