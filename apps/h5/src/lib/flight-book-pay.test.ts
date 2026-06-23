import { describe, expect, it } from "vitest";

import {
  FLIGHT_PAY_TYPE_COMPANY,
  FLIGHT_PAY_TYPE_PERSON,
  parseFlightPayTypeOptions,
  resolveDefaultFlightPayType,
  resolveFlightHoldMinutes,
} from "./flight-book-pay";

describe("parseFlightPayTypeOptions", () => {
  it("falls back to company and person", () => {
    expect(parseFlightPayTypeOptions(undefined)).toEqual([
      { value: FLIGHT_PAY_TYPE_COMPANY, label: "公付" },
      { value: FLIGHT_PAY_TYPE_PERSON, label: "个付" },
    ]);
  });

  it("maps initialize PayTypes", () => {
    expect(parseFlightPayTypeOptions({ "2": "个付", "1": "公付" })).toEqual([
      { value: 1, label: "公付" },
      { value: 2, label: "个付" },
    ]);
  });
});

describe("resolveDefaultFlightPayType", () => {
  it("prefers company pay", () => {
    expect(
      resolveDefaultFlightPayType([
        { value: 2, label: "个付" },
        { value: 1, label: "公付" },
      ]),
    ).toBe(FLIGHT_PAY_TYPE_COMPANY);
  });
});

describe("resolveFlightHoldMinutes", () => {
  it("uses tmc hold minute when present", () => {
    expect(resolveFlightHoldMinutes({ Tmc: { FlightHoldMinute: 15 } })).toBe(15);
  });

  it("defaults to 20 minutes", () => {
    expect(resolveFlightHoldMinutes({ Tmc: { FlightHoldMinute: 0 } })).toBe(20);
  });
});
