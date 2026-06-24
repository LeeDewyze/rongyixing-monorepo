import { describe, expect, it } from "vitest";
import type { IdentityDto } from "@ryx/shared-types";

import { canSaveFlightOrder, hasAgentIdentity, isSpringAirlinesBlockedForSave } from "./flight-book-save-order";

describe("hasAgentIdentity", () => {
  it("returns true when Numbers.AgentId is set", () => {
    const identity: IdentityDto = {
      Ticket: "t",
      Id: "1",
      Name: "代理",
      Numbers: { AgentId: "10001" },
    };
    expect(hasAgentIdentity(identity)).toBe(true);
  });

  it("returns false for end-customer identity", () => {
    expect(hasAgentIdentity({ Ticket: "t", Id: "1", Name: "客户" })).toBe(false);
  });
});

describe("isSpringAirlinesBlockedForSave", () => {
  it("blocks 9C and 春秋航空", () => {
    expect(isSpringAirlinesBlockedForSave({ airline: "9C" })).toBe(true);
    expect(isSpringAirlinesBlockedForSave({ airlineName: "春秋航空" })).toBe(true);
    expect(isSpringAirlinesBlockedForSave({ airline: "MU", airlineName: "东航" })).toBe(false);
  });
});

describe("canSaveFlightOrder", () => {
  const agentIdentity: IdentityDto = {
    Ticket: "t",
    Id: "1",
    Name: "代理",
    Numbers: { AgentId: "10001" },
  };

  it("requires agent identity and non-spring airline", () => {
    expect(
      canSaveFlightOrder({
        identity: agentIdentity,
        segment: { Id: "1", Number: "MU123", TakeoffTime: "", ArrivalTime: "", Airline: "MU" },
      }),
    ).toBe(true);
    expect(
      canSaveFlightOrder({
        identity: { Ticket: "t", Id: "1", Name: "客户" },
        segment: { Id: "1", Number: "MU123", TakeoffTime: "", ArrivalTime: "", Airline: "MU" },
      }),
    ).toBe(false);
    expect(
      canSaveFlightOrder({
        identity: agentIdentity,
        segment: { Id: "1", Number: "9C123", TakeoffTime: "", ArrivalTime: "", Airline: "9C" },
      }),
    ).toBe(false);
  });
});
