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

  it("getList normalizes legacy HotelDayPrices response", async () => {
    const proxyLegacy = createProxyClient({
      baseUrl: "https://example.com",
      mode: "mock",
      mockHandler: async (method) => {
        if (method === HOTEL_FLOW_METHODS.LIST) {
          return successResponse({
            HotelDayPrices: [
              {
                AvgPrice: 696,
                MinPrice: 622,
                Hotel: {
                  Id: "H10001",
                  Name: "武汉泽宇国际酒店",
                  Address: "华岭路光明地产大厦",
                  Category: "5",
                  FullFileName: "https://example.com/hotel.jpg",
                  Tag: "Tmc",
                  Variables: JSON.stringify({ AvgPrice: 696 }),
                },
              },
            ],
            DataCount: 1,
          });
        }
        return successResponse(null);
      },
    });
    const legacyApi = createHotelApi(proxyLegacy);
    const result = await legacyApi.getList({
      CityCode: "027",
      CheckInDate: "2026-05-24",
      CheckOutDate: "2026-05-28",
      HotelType: "Normal",
    });
    expect(result.Hotels).toHaveLength(1);
    expect(result.Hotels[0]?.HotelName).toBe("武汉泽宇国际酒店");
    expect(result.Hotels[0]?.Star).toBe(5);
    expect(result.Hotels[0]?.MinPrice).toBe(696);
    expect(result.Hotels[0]?.Tags).toContain("Tmc");
  });

  it("getList prefers item.AvgPrice over Variables when both exist", async () => {
    const proxyLegacy = createProxyClient({
      baseUrl: "https://example.com",
      mode: "mock",
      mockHandler: async (method) => {
        if (method === HOTEL_FLOW_METHODS.LIST) {
          return successResponse({
            HotelSearchResultDtoList: [
              {
                AvgPrice: 696,
                Hotel: {
                  Id: "H10001",
                  Name: "测试酒店",
                  AvgPrice: 622,
                  Variables: JSON.stringify({ AvgPrice: 622 }),
                },
              },
            ],
            DataCount: 1,
          });
        }
        return successResponse(null);
      },
    });
    const legacyApi = createHotelApi(proxyLegacy);
    const result = await legacyApi.getList({ CityCode: "010" });
    expect(result.Hotels[0]?.MinPrice).toBe(696);
  });

  it("getList prefers Variables.AvgPrice over Hotel.AvgPrice when item missing", async () => {
    const proxyLegacy = createProxyClient({
      baseUrl: "https://example.com",
      mode: "mock",
      mockHandler: async (method) => {
        if (method === HOTEL_FLOW_METHODS.LIST) {
          return successResponse({
            HotelDayPrices: [
              {
                Hotel: {
                  Id: "H10001",
                  Name: "测试酒店",
                  AvgPrice: 622,
                  Variables: JSON.stringify({ AvgPrice: 696 }),
                },
              },
            ],
            DataCount: 1,
          });
        }
        return successResponse(null);
      },
    });
    const legacyApi = createHotelApi(proxyLegacy);
    const result = await legacyApi.getList({ CityCode: "010" });
    expect(result.Hotels[0]?.MinPrice).toBe(696);
  });

  it("getList reads AvgPrice from Hotel Variables object", async () => {
    const proxyLegacy = createProxyClient({
      baseUrl: "https://example.com",
      mode: "mock",
      mockHandler: async (method) => {
        if (method === HOTEL_FLOW_METHODS.LIST) {
          return successResponse({
            HotelDayPrices: [
              {
                Hotel: {
                  Id: "H10002",
                  Name: "协议酒店示例",
                  VariablesObj: { AvgPrice: 428 },
                },
              },
            ],
            DataCount: 1,
          });
        }
        return successResponse(null);
      },
    });
    const legacyApi = createHotelApi(proxyLegacy);
    const result = await legacyApi.getList({ CityCode: "027" });
    expect(result.Hotels[0]?.MinPrice).toBe(428);
  });

  it("getList reads AvgPrice from Hotel Variables string", async () => {
    const proxyLegacy = createProxyClient({
      baseUrl: "https://example.com",
      mode: "mock",
      mockHandler: async (method) => {
        if (method === HOTEL_FLOW_METHODS.LIST) {
          return successResponse({
            HotelDayPrices: [
              {
                Hotel: {
                  Id: "H10002",
                  Name: "协议酒店示例",
                  Variables: JSON.stringify({ AvgPrice: 428 }),
                },
              },
            ],
            DataCount: 1,
          });
        }
        return successResponse(null);
      },
    });
    const legacyApi = createHotelApi(proxyLegacy);
    const result = await legacyApi.getList({ CityCode: "027" });
    expect(result.Hotels[0]?.MinPrice).toBe(428);
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
