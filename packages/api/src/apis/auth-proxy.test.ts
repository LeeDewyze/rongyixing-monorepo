import { describe, expect, it } from "vitest";

import { createAuthProxyApi } from "./auth-proxy.js";
import { AUTH_FLOW_METHODS } from "../methods/auth-flow.js";
import { createProxyClient } from "../proxy/proxy-client.js";
import { successResponse } from "../proxy/response-adapter.js";

describe("createAuthProxyApi (mock mode)", () => {
  const proxy = createProxyClient({
    baseUrl: "https://example.com",
    mode: "mock",
    mockHandler: async (method) => {
      if (method === AUTH_FLOW_METHODS.LOGIN) {
        return successResponse({ Ticket: "t1", Id: "1", Name: "User" });
      }
      return successResponse(null);
    },
  });
  const auth = createAuthProxyApi(proxy);

  it("login returns ticket", async () => {
    const result = await auth.login({ Name: "demo", Password: "123" });
    expect(result.Ticket).toBe("t1");
  });
});
