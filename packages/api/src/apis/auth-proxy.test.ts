import { describe, expect, it, vi } from "vitest";

import { createAuthProxyApi, createIdentityApi } from "./auth-proxy.js";
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

describe("createIdentityApi (mock mode)", () => {
  it("checks identity with legacy H5 login type when session is valid", async () => {
    let capturedData: unknown;
    const proxy = createProxyClient({
      baseUrl: "https://example.com",
      mode: "mock",
      mockHandler: async (method, data) => {
        if (method === AUTH_FLOW_METHODS.IDENTITY_CHECK) {
          capturedData = data;
          return {
            Status: false,
            Code: "",
            Message: "",
            Data: null,
          };
        }
        return successResponse(null);
      },
    });
    const identity = createIdentityApi(proxy);

    await expect(identity.check()).resolves.toEqual({ forceLogout: false, message: undefined });
    expect(capturedData).toEqual({ LoginType: "H5" });
  });

  it("treats legacy Status true as force logout", async () => {
    const proxy = createProxyClient({
      baseUrl: "https://example.com",
      mode: "mock",
      mockHandler: async (method) => {
        if (method === AUTH_FLOW_METHODS.IDENTITY_CHECK) {
          return {
            Status: true,
            Code: "success",
            Message: "您的账号已在其他设备登录",
            Data: null,
          };
        }
        return successResponse(null);
      },
    });
    const identity = createIdentityApi(proxy);

    await expect(identity.check()).resolves.toEqual({
      forceLogout: true,
      message: "您的账号已在其他设备登录",
    });
  });

  it("sendResponse does not invoke onUnauthorized for NOLOGIN identity check", async () => {
    const onUnauthorized = vi.fn();
    const proxy = createProxyClient({
      baseUrl: "https://example.com",
      mode: "mock",
      mockHandler: async (method) => {
        if (method === AUTH_FLOW_METHODS.IDENTITY_CHECK) {
          return {
            Status: false,
            Code: "NOLOGIN",
            Message: "登陆超时",
            Data: null,
          };
        }
        return successResponse(null);
      },
      onUnauthorized,
    });
    const identity = createIdentityApi(proxy);

    await expect(identity.check()).resolves.toEqual({
      forceLogout: false,
      message: "登陆超时",
    });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});
