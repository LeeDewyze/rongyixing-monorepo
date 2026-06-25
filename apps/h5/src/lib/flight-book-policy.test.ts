import { describe, expect, it } from "vitest";
import type { FlightBookPolicy } from "@ryx/shared-types";

import {
  FLIGHT_POLICY_FETCH_FAILED_MESSAGE,
  formatFlightPolicyBookBlockMessage,
  isFlightPolicyBookAllowed,
  shouldBlockBookingOnPolicyFetchFailure,
} from "./flight-book-policy";

const blockedPolicy: FlightBookPolicy = {
  Id: "fare-1",
  IsAllowBook: false,
  Rules: ["超出经济舱标准"],
};

describe("isFlightPolicyBookAllowed", () => {
  it("allows agents even when policy blocks booking", () => {
    expect(isFlightPolicyBookAllowed(blockedPolicy, true)).toBe(true);
  });

  it("blocks non-agents when IsAllowBook is false", () => {
    expect(isFlightPolicyBookAllowed(blockedPolicy, false)).toBe(false);
  });

  it("allows booking when IsAllowBook is true or undefined", () => {
    expect(isFlightPolicyBookAllowed({ IsAllowBook: true }, false)).toBe(true);
    expect(isFlightPolicyBookAllowed(undefined, false)).toBe(true);
  });
});

describe("shouldBlockBookingOnPolicyFetchFailure", () => {
  it("blocks non-agents when policy fetch fails", () => {
    expect(shouldBlockBookingOnPolicyFetchFailure(false)).toBe(true);
  });

  it("allows agents to proceed without policy", () => {
    expect(shouldBlockBookingOnPolicyFetchFailure(true)).toBe(false);
  });
});

describe("FLIGHT_POLICY_FETCH_FAILED_MESSAGE", () => {
  it("is user-facing copy for policy API failures", () => {
    expect(FLIGHT_POLICY_FETCH_FAILED_MESSAGE).toContain("差标");
  });
});

describe("formatFlightPolicyBookBlockMessage", () => {
  it("includes passenger name and rules in legacy-style message", () => {
    expect(formatFlightPolicyBookBlockMessage(blockedPolicy, "张三")).toBe(
      "张三;超出经济舱标准，超标不可预订",
    );
  });
});
