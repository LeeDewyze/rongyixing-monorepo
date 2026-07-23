import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Trafficline } from "@ryx/shared-types";

import {
  buildFlightListSearchParams,
  buildHomeIndexParams,
  cityFromQuery,
  FLIGHT_STORAGE_DATE,
  loadStoredFlightDate,
  persistFlightSearchDate,
  resolveFlightLocationCode,
} from "./flight-search";
import { todayDateString } from "./date-search";

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
        "tourist",
      ),
    ).toEqual({
      Date: "2026-06-21",
      FromCode: "BJS",
      ToCode: "SHA",
      FromAsAirport: false,
      ToAsAirport: false,
      channel: "tourist",
    });
  });
});

describe("buildFlightListSearchParams", () => {
  it("writes canonical asAirport flags to URL", () => {
    const params = buildFlightListSearchParams({
      fromCity: { Id: "9278", Tag: "AirportCity", Code: "BJS", Name: "北京" },
      toCity: airports[0]!,
      date: "2026-06-21",
      channel: "tourist",
    });
    expect(params.get("toAsAirport")).toBe("false");
    expect(params.get("fromAsAirport")).toBe("false");
    expect(params.get("channel")).toBe("tourist");
  });
});

describe("flight search date persistence", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "localStorage",
      (() => {
        const store = new Map<string, string>();
        return {
          getItem: (key: string) => store.get(key) ?? null,
          setItem: (key: string, value: string) => {
            store.set(key, value);
          },
          removeItem: (key: string) => {
            store.delete(key);
          },
          clear: () => {
            store.clear();
          },
        };
      })(),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads today when storage is empty", () => {
    expect(loadStoredFlightDate()).toBe(todayDateString());
  });

  it("loads a stored future date", () => {
    localStorage.setItem(FLIGHT_STORAGE_DATE, "2026-08-31");
    expect(loadStoredFlightDate()).toBe("2026-08-31");
  });

  it("falls back to today for past stored dates", () => {
    localStorage.setItem(FLIGHT_STORAGE_DATE, "2020-01-01");
    expect(loadStoredFlightDate()).toBe(todayDateString());
  });

  it("persists selected date", () => {
    persistFlightSearchDate("2026-08-31");
    expect(localStorage.getItem(FLIGHT_STORAGE_DATE)).toBe("2026-08-31");
  });
});
