import { describe, expect, it, vi } from "vitest";

import { createApiClient } from "../client.js";
import { createAuthApi } from "./auth.js";

describe("createAuthApi", () => {
  it("posts login credentials", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({
        success: true,
        data: {
          accessToken: "token",
          user: { id: "1", username: "demo", displayName: "Demo" },
        },
      }),
    );

    const auth = createAuthApi(
      createApiClient({
        baseUrl: "https://api.example.com",
        fetchImpl,
      }),
    );

    const result = await auth.login({ username: "demo", password: "secret" });

    expect(result.user.username).toBe("demo");
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.example.com/auth/login",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
