import { describe, expect, it } from "vitest";

import {
  FLIGHT_LIST_STALE_MS,
  FLIGHT_LIST_TIMEOUT_MS,
  buildCabinsPath,
  getFlightListEmptyMessage,
  isFlightListStale,
  isFlightListTimedOut,
  msUntilFlightListTimeout,
  passengerSelectionFingerprint,
} from "./flight-list-refresh";

describe("flight-list-refresh", () => {
  it("passengerSelectionFingerprint is order-independent", () => {
    expect(
      passengerSelectionFingerprint([
        { id: "b", passenger: {} as never, credential: {} as never },
        { id: "a", passenger: {} as never, credential: {} as never },
      ]),
    ).toBe("a,b");
  });

  it("detects stale and timeout windows", () => {
    const now = 1_000_000;
    expect(isFlightListStale(now - FLIGHT_LIST_STALE_MS, now)).toBe(true);
    expect(isFlightListStale(now - FLIGHT_LIST_STALE_MS + 1, now)).toBe(false);
    expect(isFlightListTimedOut(now - FLIGHT_LIST_TIMEOUT_MS, now)).toBe(true);
    expect(msUntilFlightListTimeout(now - 1_000, now)).toBe(FLIGHT_LIST_TIMEOUT_MS - 1_000);
  });

  it("empty message differs when filters active", () => {
    expect(getFlightListEmptyMessage(true)).toContain("符合条件的航班");
    expect(getFlightListEmptyMessage(false)).toContain("未查到航班");
  });

  it("buildCabinsPath preserves search params and adds segment fields", () => {
    const base = new URLSearchParams({ date: "2026-06-20", fromCode: "BJS", toCode: "SHA" });
    const path = buildCabinsPath(
      {
        Id: "seg-1",
        Number: "CA1234",
        TakeoffTime: "2026-06-20 08:00",
        ArrivalTime: "2026-06-20 10:00",
        FromAirport: "PEK",
        ToAirport: "PVG",
        DetailKey: "dk-1",
      },
      base,
    );
    expect(path).toContain("/flight/seg-1/cabins?");
    expect(path).toContain("flightNumber=CA1234");
    expect(path).toContain("fromAirport=PEK");
    expect(path).toContain("detailKey=dk-1");
    expect(path).toContain("date=2026-06-20");
  });

  it("buildCabinsPath forwards BookType for Home-Detail", () => {
    const path = buildCabinsPath(
      {
        Id: "seg-kn",
        Number: "KN5977",
        TakeoffTime: "2026-06-23T20:50:00",
        ArrivalTime: "2026-06-23T22:55:00",
        FromAirport: "PKX",
        ToAirport: "PVG",
        DetailKey: "dk-kn",
        BookType: 2,
      },
      new URLSearchParams(),
    );
    expect(path).toContain("bookType=2");
  });
});
