import { describe, expect, it, vi } from "vitest";

import { successResponse } from "./response-adapter.js";
import { createProxyClient } from "./proxy-client.js";

describe("createProxyClient proxy mode", () => {
  it("omits gateway extras (root) on direct microservice URLs", async () => {
    let capturedBody = "";
    const client = createProxyClient({
      baseUrl: "",
      mode: "proxy",
      apiConfig: {
        Token: "41C21104DE0D4A0B8FE4229C822576B4",
        Urls: { TmcApiFlightUrl: "http://flight-api-tmc.rtesp.com" },
      },
      getTicket: () => "a347e9bb715d4fb6a337e7792052f5c6",
      getDomain: () => "rtesp.com",
      getExtraFields: () => ({ root: "rl" }),
      fetchImpl: async (_url, init) => {
        capturedBody = String(init?.body ?? "");
        return new Response(JSON.stringify(successResponse({ FlightViews: [] })), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    });

    await client.send({
      method: "TmcApiFlightUrl-Home-Index",
      data: {
        Date: "2026-06-22",
        FromCode: "BJS",
        ToCode: "SHA",
        FromAsAirport: false,
        ToAsAirport: false,
      },
      version: "2.0",
      requestTimeout: 60,
    });

    expect(capturedBody).toContain("Method=TmcApiFlightUrl-Home-Index");
    expect(capturedBody).toContain("Timeout=60");
    expect(capturedBody).toContain("Version=2.0");
    expect(capturedBody).not.toContain("root=");
  });

  it("refreshes stale ApiConfig when current method url key is missing", async () => {
    const capturedUrls: string[] = [];
    const client = createProxyClient({
      baseUrl: "",
      mode: "proxy",
      apiConfig: {
        Token: "old-token",
        Urls: { TmcApiTrainUrl: "http://train-api-tmc.rtesp.com" },
      },
      getTicket: () => "ticket",
      fetchImpl: async (url) => {
        capturedUrls.push(String(url));
        if (String(url).startsWith("/Home/Setting")) {
          return new Response(
            JSON.stringify(
              successResponse({
                Token: "new-token",
                Urls: {
                  TmcTouristTrainUrl: "http://train-api-tourist.rtesp.com",
                },
              }),
            ),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }
        return new Response(JSON.stringify(successResponse({ TrainInfos: [] })), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    });

    await client.send({
      method: "TmcTouristTrainUrl-Home-Search",
      data: {
        From: "BJP",
        To: "SHH",
        Date: "2026-07-02",
      },
    });

    expect(capturedUrls).toEqual(["/Home/Setting", "/__ryx/TmcTouristTrainUrl/Home/Search"]);
  });

  it("posts legacy Identity/Get through /Home/Proxy and Identity/Check directly", async () => {
    const captured: Array<{ url: string; body: string }> = [];
    const client = createProxyClient({
      baseUrl: "",
      mode: "direct",
      apiConfig: {
        Token: "setting-token",
        Urls: { ApiHomeUrl: "https://api.rongtrip.cn" },
      },
      getTicket: () => "ticket-id",
      getDomain: () => "rongtrip.cn",
      getExtraFields: () => ({ root: "www" }),
      fetchImpl: async (url, init) => {
        captured.push({ url: String(url), body: String(init?.body ?? "") });
        return new Response(JSON.stringify(successResponse({ Ticket: "ticket-id" })), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    });

    await client.send({
      method: "ApiHomeUrl-Identity-Get",
      data: JSON.stringify({ Ticket: "ticket-id" }),
      requestFields: { Ticket: "ticket-id" },
      skipSign: true,
    });

    await client.sendResponse({
      method: "ApiHomeUrl-Identity-Check",
      data: JSON.stringify({ LoginType: "H5" }),
      skipSign: true,
      isShowLoading: true,
    });

    expect(captured.map((entry) => entry.url)).toEqual([
      "/Home/Proxy?domain=rongtrip.cn",
      "https://api.rongtrip.cn/Identity/Check",
    ]);
    expect(captured[0]?.body).toContain("Method=ApiHomeUrl-Identity-Get");
    expect(captured[0]?.body).toContain('Data={"Ticket":"ticket-id"}');
    expect(captured[0]?.body).toContain("root=www");
    expect(captured[0]?.body).not.toContain("Sign=");
    expect(captured[0]?.body).not.toContain("Token=");
    expect(captured[1]?.body).toContain("Method=ApiHomeUrl-Identity-Check");
    expect(captured[1]?.body).toContain('Data={"LoginType":"H5"}');
    expect(captured[1]?.body).toContain("IsShowLoading=true");
    expect(captured[1]?.body).not.toContain("root=www");
    expect(captured[1]?.body).not.toContain("Sign=");
    expect(captured[1]?.body).not.toContain("Token=");
  });
});

describe("createProxyClient mock mode", () => {
  it("returns data from mock handler", async () => {
    const client = createProxyClient({
      baseUrl: "https://example.com",
      mode: "mock",
      mockHandler: async (method, data) => successResponse({ method, data }),
    });

    const result = await client.send<{ method: string; data: unknown }>({
      method: "TmcApiHotelUrl-Home-List",
      data: { CityCode: "010" },
    });

    expect(result.method).toBe("TmcApiHotelUrl-Home-List");
    expect(result.data).toEqual({ CityCode: "010" });
  });

  it("throws ApiError when mock response fails", async () => {
    const client = createProxyClient({
      baseUrl: "https://example.com",
      mode: "mock",
      mockHandler: async () => ({
        Status: false,
        Code: "MOCK_NOT_FOUND",
        Message: "missing",
        Data: null,
      }),
    });

    await expect(client.send({ method: "Unknown-Method-Here", data: {} })).rejects.toMatchObject({
      message: "missing",
      code: "MOCK_NOT_FOUND",
    });
  });

  it("throws ApiError when response Code is null", async () => {
    const client = createProxyClient({
      baseUrl: "https://example.com",
      mode: "mock",
      mockHandler: async () => ({
        Status: false,
        Code: null as unknown as string,
        Message: "验证码错误",
        Data: null,
      }),
    });

    await expect(client.send({ method: "Mobile-Action", data: {} })).rejects.toMatchObject({
      message: "验证码错误",
    });
  });
});

describe("createProxyClient unauthorized handling", () => {
  function createUnauthorizedClient(payload: { Code: string; Message: string }) {
    const onUnauthorized = vi.fn();
    const client = createProxyClient({
      baseUrl: "",
      mode: "proxy",
      apiConfig: { Token: "token", Urls: { TmcApiHomeUrl: "http://home-api-tmc.rtesp.com" } },
      getTicket: () => "ticket",
      fetchImpl: async () =>
        new Response(JSON.stringify({ ...payload, Status: false, Data: null }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      onUnauthorized,
    });
    return { client, onUnauthorized };
  }

  it("invokes onUnauthorized for NOLOGIN code", async () => {
    const { client, onUnauthorized } = createUnauthorizedClient({
      Code: "NOLOGIN",
      Message: "登陆超时",
    });

    await expect(client.send({ method: "TmcApiHomeUrl-Member-Get", data: {} })).rejects.toThrow();
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it("does not invoke onUnauthorized when only the message reports a login timeout", async () => {
    const { client, onUnauthorized } = createUnauthorizedClient({
      Code: "SESSION_ERROR",
      Message: "登陆超时",
    });

    await expect(client.send({ method: "TmcApiHomeUrl-Member-Get", data: {} })).rejects.toThrow();
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("skips onUnauthorized for sendResponse (Identity-Check)", async () => {
    const { client, onUnauthorized } = createUnauthorizedClient({
      Code: "NOLOGIN",
      Message: "登陆超时",
    });

    await client.sendResponse({ method: "TmcApiHomeUrl-Identity-Check", data: {} });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});
