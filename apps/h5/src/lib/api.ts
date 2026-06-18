import { createApi } from "@ryx/api";

import { getApiBaseUrl } from "@/lib/env";

let apiInstance: ReturnType<typeof createApi> | null = null;

/** Lazily create the shared API client for this app. */
export function getApi() {
  if (!apiInstance) {
    apiInstance = createApi({
      baseUrl: getApiBaseUrl(),
      getAccessToken: () => localStorage.getItem("accessToken"),
      onUnauthorized: () => {
        localStorage.removeItem("accessToken");
      },
    });
  }

  return apiInstance;
}
