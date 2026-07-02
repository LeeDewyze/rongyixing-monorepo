import { describe, expect, it } from "vitest";

import { TMC_METHODS } from "../methods/tmc.js";
import {
  TOURIST_FLIGHT_BOOK_METHODS,
  TOURIST_FLIGHT_FLOW_METHODS,
} from "../methods/flight-flow.js";
import { createProxyClient } from "../proxy/proxy-client.js";
import { successResponse } from "../proxy/response-adapter.js";
import { createFlightApi } from "./flight.js";

describe("createFlightApi (mock mode)", () => {
  const proxy = createProxyClient({
    baseUrl: "https://example.com",
    mode: "mock",
    mockHandler: async (method) => {
      if (method === TMC_METHODS.RESOURCE_AIRPORT) {
        return successResponse({
          Trafficlines: [{ Code: "BJS", Name: "北京", Pinyin: "beijing", IsHot: true }],
        });
      }
      return successResponse(null);
    },
  });
  const flight = createFlightApi(proxy);

  it("getDomesticAirports returns trafficlines", async () => {
    const result = await flight.getDomesticAirports();
    expect(result).toHaveLength(1);
    expect(result[0]?.Code).toBe("BJS");
  });

  it("uses tourist flight methods when channel is tourist", async () => {
    const captured: Array<{ method: string; data: unknown }> = [];
    const proxyWithCapture = createProxyClient({
      baseUrl: "https://example.com",
      mode: "mock",
      mockHandler: async (method, data) => {
        captured.push({ method, data });
        if (method === TOURIST_FLIGHT_FLOW_METHODS.HOME_INDEX) {
          return successResponse({ Result: { FlightSegments: [] }, FlightViews: [] });
        }
        if (method === TOURIST_FLIGHT_FLOW_METHODS.HOME_DETAIL) {
          return successResponse({ FlightSegments: [], FlightFares: [] });
        }
        if (method === TOURIST_FLIGHT_BOOK_METHODS.INIT) {
          return successResponse({ OrderAmount: 100 });
        }
        if (method === TOURIST_FLIGHT_BOOK_METHODS.BOOK) {
          return successResponse({ OrderId: "order-1" });
        }
        return successResponse(null);
      },
    });
    const api = createFlightApi(proxyWithCapture);

    await api.searchFlights({
      channel: "tourist",
      Date: "2026-07-05",
      FromCode: "BJS",
      ToCode: "SHA",
    });
    await api.getFlightDetail({
      channel: "tourist",
      Date: "2026-07-05",
      FromCode: "BJS",
      ToCode: "SHA",
      FlightNumber: "MU5100",
    });
    await api.initializeBook({
      channel: "tourist",
      Passengers: [],
    });
    await api.submitBook({
      channel: "tourist",
      Passengers: [],
    });

    expect(captured.map((item) => item.method)).toEqual([
      TOURIST_FLIGHT_FLOW_METHODS.HOME_INDEX,
      TOURIST_FLIGHT_FLOW_METHODS.HOME_DETAIL,
      TOURIST_FLIGHT_BOOK_METHODS.INIT,
      TOURIST_FLIGHT_BOOK_METHODS.BOOK,
    ]);
    for (const item of captured) {
      expect(item.data).not.toHaveProperty("channel");
    }
  });
});
