import { describe, expect, it } from "vitest";

import { createHotelApi } from "./hotel.js";
import { createProxyClient } from "../proxy/proxy-client.js";
import { successResponse } from "../proxy/response-adapter.js";
import { HOTEL_FLOW_METHODS } from "../methods/hotel-flow.js";

describe("createHotelApi (mock mode)", () => {
  const proxy = createProxyClient({
    baseUrl: "https://example.com",
    mode: "mock",
    mockHandler: async (method) => {
      if (method === HOTEL_FLOW_METHODS.LIST) {
        return successResponse({ Hotels: [{ HotelId: "H1", HotelName: "Test" }], TotalCount: 1 });
      }
      return successResponse(null);
    },
  });
  const hotel = createHotelApi(proxy);

  it("getList returns hotel array", async () => {
    const result = await hotel.getList({ CityCode: "010" });
    expect(result.Hotels).toHaveLength(1);
    expect(result.Hotels[0]?.HotelId).toBe("H1");
  });

  it("getCities unwraps Trafficlines response", async () => {
    const proxyWithCities = createProxyClient({
      baseUrl: "https://example.com",
      mode: "mock",
      mockHandler: async () =>
        successResponse({
          Trafficlines: [
            { Code: "010", Name: "北京", Pinyin: "beijing", IsHot: true },
            { Code: "021", Nickname: "上海", Pinyin: "shanghai", IsHot: true },
          ],
        }),
    });
    const api = createHotelApi(proxyWithCities);
    const cities = await api.getCities();
    expect(cities).toHaveLength(2);
    expect(cities[0]?.Name).toBe("北京");
    expect(cities[1]?.Name).toBe("上海");
  });
});
