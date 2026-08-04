import { describe, expect, it } from "vitest";
import type { Trafficline } from "@ryx/shared-types";

import { displayTrafficlineBrowseName, displayTrafficlineSearchName } from "./flight-search";
import { groupByFirstLetter, normalizePickerItems } from "./city-picker";

const flightAdapter = {
  getId: (city: Trafficline) => city.Id,
  getCode: (city: Trafficline) => city.Code,
  getName: (city: Trafficline) => displayTrafficlineBrowseName(city),
  getSearchName: (city: Trafficline) => displayTrafficlineSearchName(city),
  getPinyin: (city: Trafficline) => city.Pinyin,
  getCityName: (city: Trafficline) => city.CityName,
  getIsHot: (city: Trafficline) => Boolean(city.IsHot),
  getIsDeprecated: (city: Trafficline) => Boolean(city.IsDeprecated),
  getSequence: (city: Trafficline) => city.Sequence,
  getFirstLetter: (city: Trafficline) => city.FirstLetter,
};

describe("normalizePickerItems flight city order", () => {
  it("preserves API sequence within letter sections like legacy", () => {
    const items: Trafficline[] = [
      {
        Id: "1",
        Code: "YIE",
        Name: "阿尔山伊尔施机场",
        Nickname: "阿尔山伊尔施",
        Pinyin: "aershan",
        FirstLetter: "A",
        Sequence: 0,
      },
      {
        Id: "2",
        Code: "AAT",
        Name: "阿勒泰机场",
        Nickname: "阿勒泰",
        Pinyin: "aletai",
        FirstLetter: "A",
        Sequence: 0,
      },
      {
        Id: "3",
        Code: "AKU",
        Name: "阿克苏机场",
        Nickname: "阿克苏",
        Pinyin: "akesu",
        FirstLetter: "A",
        Sequence: 0,
      },
    ];

    const normalized = normalizePickerItems(items, flightAdapter);
    const { groups } = groupByFirstLetter(normalized);

    expect(groups.A?.map((row) => row.code)).toEqual(["YIE", "AAT", "AKU"]);
  });

  it("places hot cities before non-hot after sequence sort", () => {
    const items: Trafficline[] = [
      {
        Id: "1",
        Code: "BAV",
        Name: "包头",
        Nickname: "包头",
        Pinyin: "baotou",
        FirstLetter: "B",
        Sequence: 0,
      },
      {
        Id: "2",
        Code: "BJS",
        Name: "北京",
        Nickname: "北京",
        CityName: "北京",
        Pinyin: "beijing",
        FirstLetter: "B",
        IsHot: true,
        Sequence: 2,
      },
    ];

    expect(normalizePickerItems(items, flightAdapter).map((row) => row.code)).toEqual([
      "BJS",
      "BAV",
    ]);
  });
});

describe("displayTrafficlineBrowseName", () => {
  it("uses CityName for hot cities and Nickname for others", () => {
    expect(
      displayTrafficlineBrowseName({
        Id: "1",
        Code: "AVA",
        Name: "安顺黄果树机场",
        Nickname: "黄果树机场",
        CityName: "安顺",
        IsHot: false,
      }),
    ).toBe("黄果树机场");

    expect(
      displayTrafficlineBrowseName({
        Id: "2",
        Code: "BJS",
        Name: "北京",
        Nickname: "北京",
        CityName: "北京",
        IsHot: true,
      }),
    ).toBe("北京");
  });
});
