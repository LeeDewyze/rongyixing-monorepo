import { describe, expect, it } from "vitest";

import {
  formatArrivalDateBadge,
  formatCabinsDepartTitle,
  formatFlightListMetaLine,
  formatFlightListPlaneLabel,
  formatFlightLocationLabel,
  formatFlightMealLabel,
  formatFlightMetaDuration,
  formatFlightOrderTripMetaLine,
  resolveFlightCardVariant,
  formatOrderTripAirlineFlightLabel,
  resolveTripAirlineShortName,
  shortAirlineName,
} from "./flight-list-display";

describe("flight-list-display cabins helpers", () => {
  it("formats depart title", () => {
    expect(formatCabinsDepartTitle("2026-01-05T22:05:00")).toBe("1月05日 周一出发");
  });

  it("formats location label", () => {
    expect(formatFlightLocationLabel("上海", "浦东国际机场", "T2")).toBe("上海·浦东T2");
  });

  it("shows arrival cross-day badge", () => {
    expect(formatArrivalDateBadge("2026-01-05T22:05:00", "2026-01-06T00:30:00")).toBe("1月06日");
  });

  it("formats meal and duration meta", () => {
    expect(formatFlightMealLabel("R")).toBe("茶点或小吃");
    expect(formatFlightMealLabel("早餐")).toBe("早餐");
    expect(formatFlightMealLabel("点心")).toBe("点心");
    expect(formatFlightMetaDuration("2h25m")).toBe("飞2h25m");
  });

  it("formats list card meta line with pipe separators", () => {
    expect(shortAirlineName("东方航空")).toBe("东航");
    expect(formatFlightListPlaneLabel("空客A321(中)", undefined)).toBe("空客A321（中）");
    expect(
      formatFlightListMetaLine({
        AirlineName: "联合航空",
        Number: "KN5955",
        FlightNumber: "KN5955",
        PlaneType: "73E",
        PlaneTypeDescribe: "波音737-200(大)",
        Meal: "N",
      }),
    ).toBe("联合航空 | KN5955 | 机型 73E | 无餐食");
    expect(
      formatFlightListMetaLine({
        AirlineName: "联合航空",
        Number: "KN5955",
        PlaneType: "73E",
      }),
    ).toBe("联合航空 | KN5955 | 机型 73E");
    expect(
      formatFlightListMetaLine({
        AirlineName: "南方航空",
        Number: "CZ8899",
        PlaneType: "327",
        Meal: "点心",
      }),
    ).toBe("南方航空 | CZ8899 | 机型 327 | 点心");
  });

  it("formats order detail trip meta footer like legacy ryx", () => {
    expect(
      formatFlightOrderTripMetaLine({
        PlaneType: "324",
        CabinType: "经济舱",
      }),
    ).toBe("机型 324经济舱 | 直飞");
    expect(
      formatFlightOrderTripMetaLine({
        PlaneType: "73E",
        CabinType: "经济舱",
        IsStop: true,
        StopCities: "武汉",
      }),
    ).toBe("机型 73E经济舱 | 经停武汉");
    expect(
      formatFlightOrderTripMetaLine({
        PlaneType: "320",
        IsTransfer: true,
      }),
    ).toBe("机型 320 | 中转");
  });

  it("resolves order trip airline label with code-share and IATA fallbacks", () => {
    expect(
      formatOrderTripAirlineFlightLabel({
        AirlineName: "中国国航",
        CodeShareNumber: "CA1915",
        FlightNumber: "KN5955",
      }),
    ).toBe("国航CA1915");
    expect(
      formatOrderTripAirlineFlightLabel({
        FlightNumber: "KN5955",
      }),
    ).toBe("联航KN5955");
    expect(
      resolveTripAirlineShortName({
        CodeShareNumber: "CA1915",
        CodeShareAirlineName: "中国国航",
        FlightNumber: "KN5955",
      }),
    ).toBe("国航");
  });

  it("marks every tied lowest fare as direct-lowest", () => {
    const lowest = {
      Id: "a",
      LowestFare: "330",
      isLowestPrice: true,
      IsTransfer: false,
      IsStop: false,
    };
    const other = {
      Id: "b",
      LowestFare: "500",
      isLowestPrice: false,
      IsTransfer: false,
      IsStop: false,
    };
    expect(resolveFlightCardVariant(lowest, "direct")).toBe("direct-lowest");
    expect(resolveFlightCardVariant({ ...lowest, Id: "c" }, "direct")).toBe("direct-lowest");
    expect(resolveFlightCardVariant(other, "direct")).toBe("direct");
  });
});
