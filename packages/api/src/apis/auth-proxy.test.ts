import { describe, expect, it, vi } from "vitest";

import { createAuthProxyApi, createIdentityApi } from "./auth-proxy.js";
import { AUTH_FLOW_METHODS } from "../methods/auth-flow.js";
import { createProxyClient } from "../proxy/proxy-client.js";
import { errorResponse, successResponse } from "../proxy/response-adapter.js";

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

describe("createAuthProxyApi logout", () => {
  it("matches legacy logout: unsigned ticket payload through /Home/Proxy", async () => {
    let capturedUrl = "";
    let capturedBody = "";
    const proxy = createProxyClient({
      baseUrl: "",
      mode: "proxy",
      apiConfig: {
        Token: "setting-token",
        Urls: { ApiLoginUrl: "https://login-api.rongtrip.cn" },
      },
      getTicket: () => "ticket-1",
      fetchImpl: async (url, init) => {
        capturedUrl = String(url);
        capturedBody = String(init?.body ?? "");
        return new Response(JSON.stringify(successResponse(true)), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    });

    await createAuthProxyApi(proxy).logout({ ticket: "ticket-1", ticketName: "ticket" });

    const fields = new URLSearchParams(capturedBody);
    expect(capturedUrl).toBe("/Home/Proxy");
    expect(fields.get("Method")).toBe(AUTH_FLOW_METHODS.LOGOUT);
    expect(fields.get("Data")).toBe(
      JSON.stringify({ Ticket: "ticket-1", ticket: "ticket-1" }),
    );
    expect(fields.get("Ticket")).toBe("ticket-1");
    expect(fields.get("TicketName")).toBe("");
    expect(fields.get("Sign")).toBeNull();
    expect(fields.get("Token")).toBeNull();
  });
});

describe("createAuthProxyApi RYBLogin", () => {
  it("posts external ticket only in Data when exchanging it through RYBLogin", async () => {
    let capturedUrl = "";
    let capturedBody = "";
    const proxy = createProxyClient({
      baseUrl: "",
      mode: "proxy",
      apiConfig: {
        Token: "setting-token",
        Urls: { ApiLoginUrl: "https://login-api.rongtrip.cn" },
        LoginUrl: "https://ronglv-feature.rongtrip.cn/Jyx/LoginByRyx",
      },
      getTicket: () => "old-session-ticket",
      getDomain: () => "rongtrip.cn",
      fetchImpl: async (url, init) => {
        capturedUrl = String(url);
        capturedBody = String(init?.body ?? "");
        return new Response(
          JSON.stringify(successResponse({ Ticket: "real-ticket", Id: "1", Name: "User" })),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      },
    });
    const auth = createAuthProxyApi(proxy);

    const result = await auth.rybLogin({ ticket: "external-ticket" });
    const fields = new URLSearchParams(capturedBody);

    expect(result.Ticket).toBe("real-ticket");
    expect(capturedUrl).toBe("/__ryx/ApiLoginUrl/Home/RYBLogin");
    expect(fields.get("Method")).toBe(AUTH_FLOW_METHODS.RYB_LOGIN);
    expect(fields.get("Ticket")).toBe("");
    expect(fields.get("TicketName")).toBe("");
    expect(fields.get("authType")).toBe("1");
    expect(fields.get("Token")).toBe("setting-token");
    expect(fields.get("Data")).toBe(
      JSON.stringify({ ticket: "external-ticket", LoginType: "ryb" }),
    );
    expect(capturedBody).not.toContain("old-session-ticket");
    expect(fields.get("Sign")).toBeTruthy();
  });

  it("preserves the backend failure message without invoking global unauthorized handling", async () => {
    const onUnauthorized = vi.fn();
    const proxy = createProxyClient({
      baseUrl: "",
      mode: "mock",
      onUnauthorized,
      mockHandler: async () => errorResponse("NOLOGIN", "单点登录凭证已失效"),
    });

    await expect(
      createAuthProxyApi(proxy).rybLogin({ ticket: "external-ticket" }),
    ).rejects.toMatchObject({
      message: "单点登录凭证已失效",
      code: "NOLOGIN",
    });
    expect(onUnauthorized).not.toHaveBeenCalled();
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

  it("does not treat websocket bootstrap failure as session logout", async () => {
    const onUnauthorized = vi.fn();
    const proxy = createProxyClient({
      baseUrl: "https://example.com",
      mode: "mock",
      mockHandler: async (method) => {
        if (method === AUTH_FLOW_METHODS.IDENTITY_WEBSOCKET) {
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

    await expect(identity.getWebSocketUrl()).resolves.toBeNull();
    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});
