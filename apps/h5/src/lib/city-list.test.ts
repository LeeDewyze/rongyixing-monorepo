// @vitest-environment node
import { describe, expect, it } from "vitest";

import type { FlightCityOption } from "./city-list";

import {
  deriveFirstLetter,
  filterCities,
  getAvailableLetters,
  getCityFirstLetter,
  groupByFirstLetter,
  sortFlightCitiesLikeLegacy,
} from "./city-list";

const sampleCities: FlightCityOption[] = [
  {
    Code: "BJS",
    Name: "北京",
    Nickname: "北京",
    Pinyin: "beijing",
    FirstLetter: "B",
    IsHot: true,
    Sequence: 2,
  },
  {
    Code: "SHA",
    Name: "上海",
    Nickname: "上海",
    Pinyin: "shanghai",
    FirstLetter: "S",
    Sequence: 1,
  },
  {
    Code: "AHJ",
    Name: "阿坝",
    Nickname: "阿坝",
    Pinyin: "aba",
    FirstLetter: "",
    Sequence: 0,
  },
];

describe("deriveFirstLetter", () => {
  it("returns uppercase first char of pinyin", () => {
    expect(deriveFirstLetter("beijing")).toBe("B");
    expect(deriveFirstLetter("shanghai")).toBe("S");
  });

  it("returns hash for empty pinyin", () => {
    expect(deriveFirstLetter("")).toBe("#");
    expect(deriveFirstLetter("   ")).toBe("#");
  });
});

describe("getCityFirstLetter", () => {
  it("prefers FirstLetter when set", () => {
    expect(getCityFirstLetter(sampleCities[0])).toBe("B");
  });

  it("falls back to Pinyin when FirstLetter missing", () => {
    expect(getCityFirstLetter(sampleCities[2])).toBe("A");
  });
});

describe("sortFlightCitiesLikeLegacy", () => {
  it("sorts by Sequence then moves hot cities before non-hot", () => {
    const cities: FlightCityOption[] = [
      {
        Code: "BAV",
        Name: "包头",
        Nickname: "包头",
        Pinyin: "baotou",
        FirstLetter: "B",
        Sequence: 0,
      },
      {
        Code: "BJS",
        Name: "北京",
        Nickname: "北京",
        Pinyin: "beijing",
        FirstLetter: "B",
        IsHot: true,
        Sequence: 2,
      },
      {
        Code: "BFJ",
        Name: "毕节",
        Nickname: "毕节",
        Pinyin: "bijie",
        FirstLetter: "B",
        Sequence: 0,
      },
    ];

    expect(sortFlightCitiesLikeLegacy(cities).map((c) => c.Code)).toEqual([
      "BJS",
      "BAV",
      "BFJ",
    ]);
  });

  it("keeps API order when Sequence ties", () => {
    const cities: FlightCityOption[] = [
      {
        Code: "AAT",
        Name: "阿勒泰",
        Nickname: "阿勒泰",
        Pinyin: "aletai",
        FirstLetter: "A",
        Sequence: 0,
      },
      {
        Code: "AKA",
        Name: "安康",
        Nickname: "安康",
        Pinyin: "ankang",
        FirstLetter: "A",
        Sequence: 0,
      },
      {
        Code: "AKU",
        Name: "阿克苏",
        Nickname: "阿克苏",
        Pinyin: "akesu",
        FirstLetter: "A",
        Sequence: 0,
      },
    ];

    expect(sortFlightCitiesLikeLegacy(cities).map((c) => c.Code)).toEqual([
      "AAT",
      "AKA",
      "AKU",
    ]);
  });
});

describe("groupByFirstLetter", () => {
  it("groups cities by first letter", () => {
    const groups = groupByFirstLetter(sampleCities);
    expect(groups.B).toHaveLength(1);
    expect(groups.S).toHaveLength(1);
    expect(groups.A).toHaveLength(1);
  });

  it("returns empty object for empty input", () => {
    expect(groupByFirstLetter([])).toEqual({});
  });

  it("preserves legacy order inside each section", () => {
    const groups = groupByFirstLetter([
      {
        Code: "YIE",
        Name: "阿尔山伊尔施",
        Nickname: "阿尔山伊尔施",
        Pinyin: "aershan",
        FirstLetter: "A",
        Sequence: 0,
      },
      {
        Code: "AAT",
        Name: "阿勒泰",
        Nickname: "阿勒泰",
        Pinyin: "aletai",
        FirstLetter: "A",
        Sequence: 0,
      },
      {
        Code: "AKA",
        Name: "安康",
        Nickname: "安康",
        Pinyin: "ankang",
        FirstLetter: "A",
        Sequence: 0,
      },
    ]);

    expect(groups.A?.map((c) => c.Code)).toEqual(["YIE", "AAT", "AKA"]);
  });
});

describe("filterCities", () => {
  it("returns all cities when keyword is empty", () => {
    expect(filterCities(sampleCities, "")).toHaveLength(3);
    expect(filterCities(sampleCities, "   ")).toHaveLength(3);
  });

  it("matches by name, code, and pinyin", () => {
    expect(filterCities(sampleCities, "北京")).toHaveLength(1);
    expect(filterCities(sampleCities, "bjs")).toHaveLength(1);
    expect(filterCities(sampleCities, "SHANG")).toHaveLength(1);
  });

  it("returns empty array when nothing matches", () => {
    expect(filterCities(sampleCities, "zzz")).toEqual([]);
  });
});

describe("getAvailableLetters", () => {
  it("returns sorted letters present in groups", () => {
    const groups = groupByFirstLetter(sampleCities);
    expect(getAvailableLetters(groups)).toEqual(["A", "B", "S"]);
  });
});
