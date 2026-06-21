import { describe, expect, it } from "vitest";

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
        return new Response(
          JSON.stringify(successResponse({ FlightViews: [] })),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
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
});

describe("createProxyClient mock mode", () => {
  it("returns data from mock handler", async () => {
    const client = createProxyClient({
      baseUrl: "https://example.com",
      mode: "mock",
      mockHandler: async (method, data) =>
        successResponse({ method, data }),
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

    await expect(
      client.send({ method: "Unknown-Method-Here", data: {} }),
    ).rejects.toMatchObject({ message: "missing", code: "MOCK_NOT_FOUND" });
  });
});
