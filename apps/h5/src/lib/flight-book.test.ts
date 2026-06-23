import { describe, expect, it } from "vitest";
import type { FlightFare, FlightSegment, PassengerBookInfo } from "@ryx/shared-types";

import { buildFlightOrderBookDto, resolveFlightBookDisplayAmount, resolveFlightBookOrderId } from "./flight-book";
import type { FlightBookSelection } from "./flight-book-session";

const segment: FlightSegment = {
  Id: "seg-1",
  Number: "KN5977",
  TakeoffTime: "2026-06-15T08:00:00",
  ArrivalTime: "2026-06-15T10:30:00",
};

const fare: FlightFare = {
  Code: "Z",
  SalesPrice: "680",
  FlightFareRules: [{ Name: "退改", Description: "不可退" }],
};

const selection: FlightBookSelection = {
  flightId: "seg-1",
  cabinsQuery: {
    date: "2026-06-15",
    fromCode: "PEK",
    toCode: "SHA",
    fromName: "北京",
    toName: "上海",
    fromAsAirport: true,
    toAsAirport: true,
    flightNumber: "KN5977",
    fromAirport: "PEK",
    toAirport: "SHA",
    takeoffTime: "2026-06-15T08:00:00",
    arrivalTime: "2026-06-15T10:30:00",
    detailKey: "key-1",
    bookType: "1",
    airlineName: "联航",
    flyTimeName: "2h30m",
    fromAirportName: "首都",
    toAirportName: "虹桥",
    fromTerminal: "T2",
    toTerminal: "T2",
    planeTypeDescribe: "波音737",
    meal: "有餐",
    airlineSrc: "",
  },
  segment,
  fare,
  priceSnapshotAt: Date.now(),
  selectedAt: Date.now(),
};

const passengers: PassengerBookInfo[] = [
  {
    id: "p1",
    passenger: { Id: "p1", Name: "张三", AccountId: "acc-1" },
    credential: {
      Id: "c1",
      Name: "张三",
      Mobile: "13800138000",
      Number: "110101199001011234",
      CredentialsType: 1,
    },
  },
];

describe("buildFlightOrderBookDto", () => {
  it("builds passengers with segment and cabin", () => {
    const dto = buildFlightOrderBookDto({ selection, passengers });
    expect(dto.Passengers).toHaveLength(1);
    expect(dto.Passengers[0]?.ClientId).toBe("acc-1");
    expect(dto.Passengers[0]?.FlightSegments?.[0]?.Number).toBe("KN5977");
    expect(dto.Passengers[0]?.FlightCabin?.Code).toBe("Z");
    expect(dto.Passengers[0]?.FlightCabin?.Rules).toBeDefined();
  });

  it("adds linkman when provided", () => {
    const dto = buildFlightOrderBookDto({
      selection,
      passengers,
      linkman: { name: "李四", mobile: "13900139000" },
    });
    expect(dto.Linkmans?.[0]?.Name).toBe("李四");
    expect(dto.Linkmans?.[0]?.MessageLang).toBeUndefined();
  });

  it("sets travel pay type on dto and passengers", () => {
    const dto = buildFlightOrderBookDto({
      selection,
      passengers,
      travelPayType: 2,
    });
    expect(dto.TravelPayType).toBe(2);
    expect(dto.Passengers[0]?.TravelPayType).toBe(2);
  });
});

describe("resolveFlightBookDisplayAmount", () => {
  it("uses cabin price times passenger count only", () => {
    expect(resolveFlightBookDisplayAmount(selection, 2)).toBe(1360);
  });
});

describe("resolveFlightBookOrderId", () => {
  it("prefers TradeNo over OrderId", () => {
    expect(resolveFlightBookOrderId({ TradeNo: "T1", OrderId: "O1" })).toBe("T1");
  });

  it("falls back to OrderId", () => {
    expect(resolveFlightBookOrderId({ OrderId: "O1" })).toBe("O1");
  });
});
