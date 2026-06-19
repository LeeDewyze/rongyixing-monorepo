import { createApi } from "@ryx/api";
import { createDefaultMockHandler } from "@ryx/mock";

import { getApiBaseUrl, getApiMode, getMockDelay } from "@/lib/env";

let apiInstance: ReturnType<typeof createApi> | null = null;

function getTicket(): string | null {
  return localStorage.getItem("ticket");
}

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
        localStorage.removeItem("accessToken");
        localStorage.removeItem("ticket");
      },
    });
  }

  return apiInstance;
}
