import { describe, expect, it } from "vitest";
import type { FlightRouteMiddleInput } from "./flight-list-display";

import {
  formatArrivalDateBadge,
  formatArrivalDayOffsetLabel,
  formatCabinsDepartTitle,
  formatFlightListAirlineFlightLabel,
  formatFlightListAirportLine,
  formatFlightListMetaLine,
  formatFlightListPlaneLabel,
  formatFlightListPlaneSubtitle,
  formatFlightLocationLabel,
  formatFlightMealLabel,
  formatFlightLegDateTip,
  formatFlightMetaDuration,
  formatFlightRouteMiddleDisplay,
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
    expect(formatArrivalDayOffsetLabel("2026-01-05T22:05:00", "2026-01-06T00:30:00")).toBe("+1天");
  });

  it("formats pad list airport and airline labels", () => {
    expect(formatFlightListAirportLine("北京市", "北京大兴国际机场", undefined)).toBe("北京大兴");
    expect(formatFlightListAirportLine("北京市", "北京首都国际机场", "T3")).toBe("北京首都 T3");
    expect(formatFlightListAirportLine("长沙市", "长沙黄花国际机场", "T2")).toBe("长沙黄花 T2");
    expect(formatFlightListAirportLine("上海市", "浦东国际机场", "T2")).toBe("浦东 T2");
    expect(
      formatFlightListAirlineFlightLabel({
        AirlineName: "中国国航",
        Number: "CA1915",
      }),
    ).toBe("国航CA1915");
    expect(
      formatFlightListPlaneSubtitle({
        PlaneTypeDescribe: "空客A321(中)",
        PlaneType: "321",
      }),
    ).toBe("空客A321（中）");
  });

  it("formats meal and duration meta", () => {
    expect(formatFlightMealLabel("R")).toBe("茶点或小吃");
    expect(formatFlightMealLabel("早餐")).toBe("早餐");
    expect(formatFlightMealLabel("点心")).toBe("点心");
    expect(formatFlightMetaDuration("2h25m")).toBe("飞2h25m");
    expect(formatFlightLegDateTip("2026-07-24 07:35:00", "2026-07-23")).toBe("07-24");
  });

  it("formats route middle labels for transfer and stop flights", () => {
    expect(
      formatFlightRouteMiddleDisplay({
        IsTransfer: true,
        FlyTimeName: "5h30m",
        Transfer: { CityName: "厦门" },
      }),
    ).toEqual({
      durationLabel: "飞5h30m",
      routeLabel: "中转 · 厦门",
    });
    expect(
      formatFlightRouteMiddleDisplay({
        IsStop: true,
        FlyTimeName: "2h20m",
        StopCity: "武汉",
      }),
    ).toEqual({
      durationLabel: "飞2h20m",
      routeLabel: "经停 · 武汉",
    });
    expect(
      formatFlightRouteMiddleDisplay({
        IsTransfer: true,
        Duration: 610,
        Transfer: { City: { Name: "厦门" } },
      } as unknown as FlightRouteMiddleInput),
    ).toEqual({
      durationLabel: "飞610",
      routeLabel: "中转 · 厦门",
    });
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
