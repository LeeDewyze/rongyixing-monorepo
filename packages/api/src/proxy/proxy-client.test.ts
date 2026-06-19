import { describe, expect, it } from "vitest";

import { successResponse } from "./response-adapter.js";
import { createProxyClient } from "./proxy-client.js";

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
