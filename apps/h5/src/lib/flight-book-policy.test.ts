import { describe, expect, it } from "vitest";
import type {
  FlightBookPolicy,
  FlightDetailResult,
  FlightListResult,
  PassengerBookInfo,
} from "@ryx/shared-types";

import {
  buildFlightPolicyParams,
  FLIGHT_POLICY_FETCH_FAILED_MESSAGE,
  findPolicyForFare,
  formatFlightPolicyBookBlockMessage,
  isFlightPolicyBookAllowed,
  resolvePassengerAccountId,
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

  it("coerces string false from legacy API", () => {
    expect(isFlightPolicyBookAllowed({ IsAllowBook: "false" as unknown as boolean }, false)).toBe(
      false,
    );
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

  it("includes masked credential when passenger info is provided", () => {
    expect(
      formatFlightPolicyBookBlockMessage(
        {
          IsAllowBook: false,
          Rules: ["违反舱位类别政策只能选择经济舱"],
        },
        {
          id: "c1",
          passenger: { Id: "p1", Name: "申晓杰" },
          credential: {
            Id: "c1",
            Name: "申晓杰",
            Number: "410928199005125121",
          },
        },
      ),
    ).toBe("申晓杰(410928********5121);违反舱位类别政策只能选择经济舱，超标不可预订");
  });
});

describe("resolvePassengerAccountId", () => {
  it("prefers passenger AccountId then credential AccountId", () => {
    expect(
      resolvePassengerAccountId({
        id: "p1",
        passenger: { Id: "p1", Name: "申晓杰", AccountId: "acc-passenger" },
        credential: { Id: "c1", Name: "申晓杰", AccountId: "acc-credential" },
      }),
    ).toBe("acc-passenger");
    expect(
      resolvePassengerAccountId({
        id: "p1",
        passenger: { Id: "p1", Name: "申晓杰" },
        credential: { Id: "c1", Name: "申晓杰", AccountId: "acc-credential" },
      }),
    ).toBe("acc-credential");
  });
});

describe("findPolicyForFare", () => {
  it("matches proxy fare via Variables BizCode and numeric cabin price", () => {
    const fare = {
      Id: "eadaf653733d494a959f155d15910e44",
      BookCode: "J",
      SalesPrice: "3990",
      Variables: JSON.stringify({
        BizCode: "eadaf653733d494a959f155d15910e44",
        FareBasis: "J",
      }),
      FlightFareBasics: [{ CabinCode: "J", CabinType: 2, FareBasic: "J" }],
    };
    const policy = findPolicyForFare(
      [
        {
          Id: "eadaf653733d494a959f155d15910e44",
          IsAllowBook: false,
          Rules: ["违反舱位类别政策只能选择经济舱"],
          Cabin: {
            BookCode: "J",
            SalesPrice: 3990,
            FlightFareBasics: [{ CabinCode: "J", CabinType: 2 }],
          },
        },
      ],
      fare,
    );
    expect(policy?.IsAllowBook).toBe(false);
  });
});

describe("buildFlightPolicyParams", () => {
  const passengers: PassengerBookInfo[] = [
    {
      id: "p1",
      passenger: { Id: "p1", Name: "申晓杰", AccountId: "acc-1" },
      credential: { Id: "c1", Name: "申晓杰", Number: "110101199001011234", CredentialsType: 1 },
    },
  ];

  const detailSnapshot: FlightDetailResult = {
    FlightSegments: [{ Id: "sKN5955", Number: "KN5955", TakeoffTime: "", ArrivalTime: "" }],
    FlightFares: [
      {
        Id: "biz-c",
        BookCode: "C",
        SalesPrice: "2600",
        FlightNumber: "KN5955",
        FlightFareBasics: [{ CabinCode: "C", CabinType: 2 }],
      },
    ],
  };

  it("merges detail cabins into the matching list segment for Home-Policy", () => {
    const listSnapshot: FlightListResult = {
      Result: {
        FlightSegments: [{ Id: "list-seg", Number: "KN5955", TakeoffTime: "", ArrivalTime: "" }],
        FlightFares: [],
      },
    };

    const params = buildFlightPolicyParams({ listSnapshot, detailSnapshot, passengers });
    expect(params).not.toBeNull();
    const flights = JSON.parse(params!.Flights) as {
      FlightSegments: Array<{ Number: string; Cabins?: Array<{ Id?: string }> }>;
    };
    const seg = flights.FlightSegments.find((s) => s.Number === "KN5955");
    expect(seg?.Cabins?.length).toBe(1);
    expect(seg?.Cabins?.[0]?.Id).toBe("biz-c");
  });
});
