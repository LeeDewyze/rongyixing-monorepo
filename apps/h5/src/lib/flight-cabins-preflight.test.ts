import { describe, expect, it } from "vitest";

import {
  resolveFlightCabinsDetailSnapshot,
  resolveFlightExchangePrefetchOptions,
} from "./flight-cabins-preflight";

describe("resolveFlightExchangePrefetchOptions", () => {
  it("returns exchange options when list url is in exchange mode", () => {
    const params = new URLSearchParams({
      exchange: "1",
      ticketId: "21600000000395",
    });
    expect(resolveFlightExchangePrefetchOptions(params)).toEqual({
      ticketId: "21600000000395",
      isExchange: true,
    });
  });

  it("returns undefined for normal list urls", () => {
    const params = new URLSearchParams({ date: "2026-08-04" });
    expect(resolveFlightExchangePrefetchOptions(params)).toBeUndefined();
  });
});

describe("resolveFlightCabinsDetailSnapshot", () => {
  const query = {
    date: "2026-08-04",
    fromCode: "BJS",
    toCode: "TAO",
    fromName: "北京",
    toName: "青岛",
    fromAsAirport: false,
    toAsAirport: false,
    flightNumber: "SC4652",
    fromAirport: "PEK",
    toAirport: "TAO",
    takeoffTime: "2026-08-04 21:15:00",
    arrivalTime: "2026-08-04 22:45:00",
    detailKey: "",
    bookType: "",
    airlineName: "",
    flyTimeName: "",
    fromAirportName: "",
    toAirportName: "",
    fromTerminal: "",
    toTerminal: "",
    planeTypeDescribe: "",
    meal: "",
    airlineSrc: "",
    ticketId: "21600000000395",
    exchange: "1",
  };

  it("falls back to cached detail when detail api fails", () => {
    const detail = resolveFlightCabinsDetailSnapshot({
      query,
      cachedDetail: {
        FlightFares: [{ SalesPrice: "680", FlightNumber: "SC4652" }],
      },
      isExchangeBook: true,
      listParams: {
        Date: "2026-08-04",
        FromCode: "BJS",
        ToCode: "TAO",
      },
    });

    expect(detail.FlightFares).toHaveLength(1);
    expect(detail.FlightFares?.[0]?.SalesPrice).toBe("680");
  });
});
