import { describe, expect, it } from "vitest";
import type { PassengerBookInfo } from "@ryx/shared-types";

import {
  resolveFlightBookTmcFlags,
  resolveFlightBookAgentId,
  resolveInitialFlightBookAgentId,
  resolveTotalServiceFee,
} from "./flight-book-pay";

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

describe("resolveFlightBookAgentId", () => {
  it("uses explicit agent id or defaults to the first service", () => {
    const agents = [{ Id: "A1" }, { Id: "A2" }];
    expect(resolveFlightBookAgentId("A2", agents)).toBe("A2");
    expect(resolveFlightBookAgentId(null, agents)).toBe("A1");
    expect(resolveFlightBookAgentId(null, [])).toBeUndefined();
  });
});

describe("resolveInitialFlightBookAgentId", () => {
  it("keeps current selection or defaults like Legacy initialize", () => {
    const agents = [{ Id: "A1" }, { Id: "A2" }];
    expect(resolveInitialFlightBookAgentId("A2", agents)).toBe("A2");
    expect(resolveInitialFlightBookAgentId(null, agents)).toBe("A1");
    expect(resolveInitialFlightBookAgentId(null, [])).toBeNull();
  });
});

describe("resolveFlightBookTmcFlags", () => {
  it("reads notify language and service fee flags from Tmc", () => {
    expect(
      resolveFlightBookTmcFlags({
        Tmc: { IsShowServiceFee: true, IsDisplayNotifyLanguage: true },
      }),
    ).toEqual({
      isShowServiceFee: true,
      isDisplayNotifyLanguage: true,
    });
  });
});

describe("resolveTotalServiceFee", () => {
  it("sums service fees by passenger account id", () => {
    expect(resolveTotalServiceFee(passengers, { "acc-1": 10, "acc-2": 5 })).toBe(10);
    expect(
      resolveTotalServiceFee([passengers[0]!, passengers[0]!], { "acc-1": 10 }),
    ).toBe(20);
  });
});
