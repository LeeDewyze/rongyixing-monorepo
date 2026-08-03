import { describe, expect, it } from "vitest";
import type { HotelCity } from "@ryx/shared-types";

import {
  buildHotelListSearchParams,
  hotelCityFromQuery,
  resolveHotelCityInCatalog,
} from "./hotel-search";
import { buildHotelMyPositionText } from "./geolocation";

const catalog: HotelCity[] = [
  { Code: "1101", Name: "北京", Pinyin: "beijing", IsHot: true },
  { Code: "0201", Name: "上海", Pinyin: "shanghai", IsHot: true },
];

describe("resolveHotelCityInCatalog", () => {
  it("returns catalog entry when code matches", () => {
    expect(resolveHotelCityInCatalog(catalog, { Code: "1101", Name: "北京" })).toEqual(catalog[0]);
  });

  it("upgrades legacy mock code to TMC code by city name", () => {
    expect(resolveHotelCityInCatalog(catalog, { Code: "010", Name: "北京" })).toEqual(catalog[0]);
  });

  it("returns input when catalog is empty", () => {
    const legacy = { Code: "010", Name: "北京" };
    expect(resolveHotelCityInCatalog([], legacy)).toEqual(legacy);
  });

  it("returns input when no catalog match exists", () => {
    const unknown = { Code: "999", Name: "未知" };
    expect(resolveHotelCityInCatalog(catalog, unknown)).toEqual(unknown);
  });
});

describe("hotelCityFromQuery", () => {
  it("resolves URL params against catalog", () => {
    expect(hotelCityFromQuery(catalog, "010", "北京")).toEqual(catalog[0]);
  });

  it("falls back to raw params when catalog has no match", () => {
    expect(hotelCityFromQuery([], "010", "北京")).toEqual({
      Code: "010",
      Name: "北京",
    });
  });
});

describe("buildHotelMyPositionText", () => {
  it("joins city, district, and street like legacy ryx", () => {
    expect(
      buildHotelMyPositionText({
        city: "无锡市",
        district: "滨湖区",
        street: "太湖大道",
      }),
    ).toBe("无锡市滨湖区太湖大道");
  });

  it("returns empty string when address is missing", () => {
    expect(buildHotelMyPositionText()).toBe("");
  });
});

describe("buildHotelListSearchParams", () => {
  const city: HotelCity = { Code: "1101", Name: "北京" };
  const myPosition = { lat: 39.9, lng: 116.4, text: "北京市朝阳区建国路" };

  it("appends lat/lng and keywordType when myPosition is set", () => {
    const params = buildHotelListSearchParams({
      city,
      checkIn: "2026-07-05",
      checkOut: "2026-07-06",
      myPosition,
    });
    expect(params.get("lat")).toBe("39.9");
    expect(params.get("lng")).toBe("116.4");
    expect(params.get("keywordType")).toBe("address");
    expect(params.get("keyword")).toBe(myPosition.text);
  });

  it("prefers explicit keyword over myPosition text", () => {
    const params = buildHotelListSearchParams({
      city,
      checkIn: "2026-07-05",
      checkOut: "2026-07-06",
      myPosition,
      keyword: "国贸",
    });
    expect(params.get("keyword")).toBe("国贸");
    expect(params.get("keywordType")).toBe("address");
  });
});
