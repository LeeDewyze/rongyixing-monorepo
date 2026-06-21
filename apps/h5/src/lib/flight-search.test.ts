import { describe, expect, it } from "vitest";
import type { Trafficline } from "@ryx/shared-types";

import {
  buildFlightListSearchParams,
  buildHomeIndexParams,
  cityFromQuery,
  resolveFlightLocationCode,
} from "./flight-search";

const airports: Trafficline[] = [
  {
    Id: "9280",
    Tag: "AirportCity",
    Code: "SHA",
    AirportCityCode: "SHA",
    Name: "上海",
    Nickname: "上海",
  },
  {
    Id: "9282",
    Tag: "Airport",
    Code: "SHA",
    AirportCityCode: "SHA",
    Name: "虹桥国际机场",
    Nickname: "虹桥",
    CityName: "上海",
  },
  {
    Id: "9283",
    Tag: "Airport",
    Code: "PVG",
    AirportCityCode: "SHA",
    Name: "浦东国际机场",
    Nickname: "浦东",
    CityName: "上海",
  },
];

describe("resolveFlightLocationCode", () => {
  it("uses AirportCityCode for city search", () => {
    expect(
      resolveFlightLocationCode({
        Id: "9278",
        Tag: "AirportCity",
        Code: "BJS",
        AirportCityCode: "BJS",
        Name: "北京",
      }),
    ).toBe("BJS");
  });

  it("uses airport Code for airport search", () => {
    expect(resolveFlightLocationCode(airports[2]!)).toBe("PVG");
  });
});

describe("cityFromQuery", () => {
  it("prefers AirportCity when toAsAirport is false", () => {
    const city = cityFromQuery(airports, "SHA", "上海", false);
    expect(city.Tag).toBe("AirportCity");
    expect(city.Name).toBe("上海");
  });

  it("prefers Airport when toAsAirport is true", () => {
    const city = cityFromQuery(airports, "SHA", "虹桥", true);
    expect(city.Tag).toBe("Airport");
    expect(city.Code).toBe("SHA");
  });

  it("prefers city when name matches city even if URL says airport", () => {
    const city = cityFromQuery(airports, "SHA", "上海", true);
    expect(city.Tag).toBe("AirportCity");
    expect(city.Name).toBe("上海");
  });
});

describe("buildHomeIndexParams", () => {
  it("matches legacy city query flags", () => {
    expect(
      buildHomeIndexParams(
        { Id: "9278", Tag: "AirportCity", Code: "BJS", AirportCityCode: "BJS", Name: "北京" },
        airports[0]!,
        "2026-06-21",
      ),
    ).toEqual({
      Date: "2026-06-21",
      FromCode: "BJS",
      ToCode: "SHA",
      FromAsAirport: false,
      ToAsAirport: false,
    });
  });
});

describe("buildFlightListSearchParams", () => {
  it("writes canonical asAirport flags to URL", () => {
    const params = buildFlightListSearchParams({
      fromCity: { Id: "9278", Tag: "AirportCity", Code: "BJS", Name: "北京" },
      toCity: airports[0]!,
      date: "2026-06-21",
    });
    expect(params.get("toAsAirport")).toBe("false");
    expect(params.get("fromAsAirport")).toBe("false");
  });
});
