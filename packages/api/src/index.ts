import { createAuthApi } from "./apis/auth.js";
import { createApiClient, type ApiClient, type ApiClientConfig } from "./client.js";

export { ApiError } from "./errors.js";
export { createApiClient, type ApiClient, type ApiClientConfig } from "./client.js";
export { createAuthApi, type AuthApi } from "./apis/auth.js";

export interface Api {
  client: ApiClient;
  auth: ReturnType<typeof createAuthApi>;
}

/** Create a shared API surface for all client apps. */
export function createApi(config: ApiClientConfig): Api {
  const client = createApiClient(config);

  return {
    client,
    auth: createAuthApi(client),
  };
}
