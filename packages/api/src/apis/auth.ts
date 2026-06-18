import type { LoginRequest, LoginResponse } from "@ryx/shared-types";

import type { ApiClient } from "../client.js";

export function createAuthApi(client: ApiClient) {
  return {
    login(body: LoginRequest) {
      return client.post<LoginResponse>("/auth/login", body);
    },

    logout() {
      return client.post<void>("/auth/logout");
    },

    getProfile() {
      return client.get<LoginResponse["user"]>("/auth/me");
    },
  };
}

export type AuthApi = ReturnType<typeof createAuthApi>;
