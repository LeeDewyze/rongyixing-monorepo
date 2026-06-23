import { describe, expect, it } from "vitest";
import type { FlightFare, FlightSegment, PassengerBookInfo } from "@ryx/shared-types";

import { buildFlightOrderBookDto, resolveFlightBookBillBreakdown, resolveFlightBookDisplayAmount, resolveFlightBookOrderId } from "./flight-book";
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

  it("sets message language on passengers and linkman", () => {
    const dto = buildFlightOrderBookDto({
      selection,
      passengers,
      messageLang: "cn",
      linkman: { name: "李四", mobile: "13900139000", messageLang: "cn" },
    });
    expect(dto.Passengers[0]?.MessageLang).toBe("cn");
    expect(dto.Linkmans?.[0]?.MessageLang).toBe("cn");
  });

  it("uses authorized contacts as linkmans when provided", () => {
    const dto = buildFlightOrderBookDto({
      selection,
      passengers,
      authorizedContacts: [
        {
          accountId: "acc-2",
          name: "李四",
          mobile: "13900139000",
          notifyLanguage: "cn",
        },
      ],
      linkman: { name: "张三", mobile: "13800138000", messageLang: "cn" },
    });
    expect(dto.Linkmans).toEqual([
      {
        Id: "acc-2",
        Name: "李四",
        Mobile: "13900139000",
        Email: undefined,
        MessageLang: "cn",
      },
    ]);
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
  it("includes ticket, tax lines and service fee per passenger", () => {
    const taxedFare: FlightFare = {
      ...fare,
      SalesPrice: "360",
      FlightFareBasics: [
        {
          FlightTaxs: [
            { Name: "机场建设费", Tax: 50 },
            { Name: "燃油费", Tax: 170 },
          ],
        },
      ],
    };
    const taxedSelection = { ...selection, fare: taxedFare };
    expect(
      resolveFlightBookDisplayAmount(taxedSelection, passengers, { "acc-1": 10 }),
    ).toBe(590);
  });

  it("multiplies base fare by passenger count", () => {
    expect(resolveFlightBookDisplayAmount(selection, passengers)).toBe(680);
    expect(
      resolveFlightBookDisplayAmount(selection, [passengers[0]!, passengers[0]!]),
    ).toBe(1360);
  });
});

describe("resolveFlightBookBillBreakdown", () => {
  it("builds per-passenger lines with route and taxes", () => {
    const taxedFare: FlightFare = {
      ...fare,
      SalesPrice: "360",
      FlightFareBasics: [
        {
          FlightTaxs: [
            { Name: "机场建设费", Tax: 50 },
            { Name: "燃油费", Tax: 170 },
          ],
        },
      ],
    };
    const taxedSelection: FlightBookSelection = {
      ...selection,
      segment: { ...segment, FromCityName: "北京", ToCityName: "上海" },
      fare: taxedFare,
    };
    const breakdown = resolveFlightBookBillBreakdown({
      selection: taxedSelection,
      passengers,
      serviceFees: { "acc-1": 10 },
    });
    expect(breakdown.passengers[0]).toMatchObject({
      passengerName: "张三",
      fromCity: "北京",
      toCity: "上海",
      ticketPrice: 360,
      flightRouteLabel: "KN5977北京--上海",
      serviceFee: 10,
      subtotal: 590,
    });
    expect(breakdown.passengers[0]?.taxLines).toHaveLength(2);
    expect(breakdown.total).toBe(590);
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
