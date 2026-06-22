import { describe, expect, it } from "vitest";
import type { HotelCity } from "@ryx/shared-types";

import { hotelCityFromQuery, resolveHotelCityInCatalog } from "./hotel-search";

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
