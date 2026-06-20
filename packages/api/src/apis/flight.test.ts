import { describe, expect, it } from "vitest";

import { TMC_METHODS } from "../methods/tmc.js";
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
});
