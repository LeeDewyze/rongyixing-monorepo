import { describe, expect, it } from "vitest";
import type { TrainItem } from "@ryx/shared-types";
import { TrainSeatType } from "@ryx/shared-types";

import {
  applyTrainPolicyColors,
  buildTrainPolicyParams,
  isTrainSeatBookable,
  matchesTrainPolicySeat,
  resolvePolicySeatType,
  trainPolicyButtonClassName,
} from "./train-book-policy";

describe("resolvePolicySeatType", () => {
  it("maps berth variants to parent type", () => {
    expect(resolvePolicySeatType({ SeatType: TrainSeatType.HardBerthUp })).toBe(
      TrainSeatType.HardBerth,
    );
    expect(resolvePolicySeatType({ SeatType: TrainSeatType.HardBerthDown })).toBe(
      TrainSeatType.HardBerth,
    );
    expect(resolvePolicySeatType({ SeatType: TrainSeatType.SoftBerthUp })).toBe(
      TrainSeatType.SoftBerth,
    );
  });

  it("falls back to stripped seat name", () => {
    expect(resolvePolicySeatType({ SeatTypeName: "硬卧上" })).toBe(TrainSeatType.HardBerth);
    expect(resolvePolicySeatType({ SeatTypeName: "软卧下" })).toBe(TrainSeatType.SoftBerth);
  });

  it("keeps G/D seat classes unchanged", () => {
    expect(resolvePolicySeatType({ SeatType: TrainSeatType.SecondClassSeat })).toBe(
      TrainSeatType.SecondClassSeat,
    );
  });
});

describe("matchesTrainPolicySeat", () => {
  const train: TrainItem = {
    TrainNo: "2400000D0008",
    TrainCode: "D321",
    StartTime: "2025-06-26 08:00",
    ArrivalTime: "2025-06-26 16:30",
    FromStation: "北京",
    ToStation: "上海",
    Seats: [],
  };

  it("matches legacy key TrainNo + SeatType with loose equality", () => {
    expect(
      matchesTrainPolicySeat(
        { TrainNo: "2400000D0008", SeatType: TrainSeatType.BusinessBerthDown },
        train,
        { SeatType: TrainSeatType.BusinessBerthDown, SeatTypeName: "动卧" },
      ),
    ).toBe(true);
  });

  it("does not match when TrainNo differs (legacy uses TrainNo only)", () => {
    expect(
      matchesTrainPolicySeat(
        { TrainNo: "D321", SeatType: TrainSeatType.BusinessBerthDown },
        train,
        { SeatType: TrainSeatType.BusinessBerthDown, SeatTypeName: "动卧" },
      ),
    ).toBe(false);
  });

  it("does not match when SeatType differs (legacy exact enum)", () => {
    expect(
      matchesTrainPolicySeat(
        { TrainNo: "2400000D0008", SeatType: TrainSeatType.BusinessBerthDown },
        train,
        { SeatType: TrainSeatType.BusinessBerthUp, SeatTypeName: "动卧" },
      ),
    ).toBe(false);
  });

  it("does not match when seat SeatType is missing", () => {
    expect(
      matchesTrainPolicySeat(
        { TrainNo: "2400000D0008", SeatType: TrainSeatType.SoftBerth },
        train,
        { SeatTypeName: "软卧" },
      ),
    ).toBe(false);
  });
});

describe("applyTrainPolicyColors", () => {
  const train: TrainItem = {
    Id: "k1999",
    TrainNo: "K1999",
    TrainCode: "K1999",
    StartTime: "2025-06-26 22:30",
    ArrivalTime: "2025-06-27 14:15",
    FromStation: "北京",
    ToStation: "上海",
    Seats: [
      { SeatType: TrainSeatType.HardSeat, SeatTypeName: "硬座", Price: 189, Count: 99 },
      { SeatType: TrainSeatType.SoftBerth, SeatTypeName: "软卧", Price: 504, Count: 2 },
    ],
  };

  const policyResults = [
    {
      PassengerKey: "acc-1",
      TrainPolicies: [
        {
          TrainNo: "K1999",
          SeatType: TrainSeatType.HardSeat,
          IsAllowBook: true,
          Rules: [],
        },
        {
          TrainNo: "K1999",
          SeatType: TrainSeatType.SoftBerth,
          IsAllowBook: false,
          Rules: ["违反座位类型"],
        },
      ],
    },
  ];

  const passengers = [
    {
      id: "p1",
      passenger: { Id: "p1", AccountId: "acc-1", Name: "Test" },
      credential: { Id: "c1", Name: "Test", AccountId: "acc-1" },
    },
  ] as const;

  it("colors hard seat success and soft berth danger", () => {
    const colored = applyTrainPolicyColors([train], policyResults, passengers as never, "p1");
    const seats = colored[0]?.Seats ?? [];
    expect(seats[0]?.policyColor).toBe("success");
    expect(seats[1]?.policyColor).toBe("danger");
    expect(seats[1]?.policy?.Rules).toContain("违反座位类型");
  });

  it("colors动卧 danger when policy echoes same TrainNo and SeatType", () => {
    const dTrain: TrainItem = {
      Id: "d1",
      TrainNo: "2400000D0008",
      TrainCode: "D321",
      StartTime: "2025-06-26 08:00",
      ArrivalTime: "2025-06-26 16:30",
      FromStation: "北京",
      ToStation: "上海",
      Seats: [
        {
          SeatType: TrainSeatType.BusinessBerthDown,
          SeatTypeName: "动卧",
          Price: 713.5,
          Count: 8,
          BedInfos: [
            { BedTypeName: "上铺", Price: 713.5 },
            { BedTypeName: "下铺", Price: 802.5 },
          ],
        },
      ],
    };

    const businessBerthPolicies = [
      {
        PassengerKey: "acc-1",
        TrainPolicies: [
          {
            TrainNo: "2400000D0008",
            SeatType: TrainSeatType.BusinessBerthDown,
            IsAllowBook: false,
            Rules: ["违反座位类型"],
          },
        ],
      },
    ];

    const colored = applyTrainPolicyColors(
      [dTrain],
      businessBerthPolicies,
      passengers as never,
      "p1",
    );
    expect(colored[0]?.Seats?.[0]?.policyColor).toBe("danger");
  });

  it("matches policy by full TrainNo when policy echoes internal id", () => {
    const train: TrainItem = {
      TrainNo: "2400000G1008",
      TrainCode: "G1",
      StartTime: "2025-06-26 09:00",
      ArrivalTime: "2025-06-26 13:28",
      FromStation: "北京南",
      ToStation: "上海虹桥",
      Seats: [{ SeatType: TrainSeatType.SecondClassSeat, SeatTypeName: "二等座", Price: 553 }],
    };

    const policies = [
      {
        PassengerKey: "acc-1",
        TrainPolicies: [
          {
            TrainNo: "2400000G1008",
            SeatType: TrainSeatType.SecondClassSeat,
            IsAllowBook: true,
            Rules: ["需提前预订"],
          },
        ],
      },
    ];

    const colored = applyTrainPolicyColors([train], policies, passengers as never, "p1");
    expect(colored[0]?.Seats?.[0]?.policyColor).toBe("warning");
  });

  it("uses secondary when no policy entry matches", () => {
    const colored = applyTrainPolicyColors(
      [train],
      [{ PassengerKey: "acc-1", TrainPolicies: [] }],
      passengers as never,
      "p1",
    );
    expect(colored[0]?.Seats?.[0]?.policyColor).toBe("secondary");
  });

  it("maps warning when Rules exist and booking is allowed", () => {
    const policies = [
      {
        PassengerKey: "acc-1",
        TrainPolicies: [
          {
            TrainNo: "K1999",
            SeatType: TrainSeatType.HardSeat,
            IsAllowBook: true,
            Rules: ["需提前3天预订"],
          },
        ],
      },
    ];

    const colored = applyTrainPolicyColors([train], policies, passengers as never, "p1");
    expect(colored[0]?.Seats?.[0]?.policyColor).toBe("warning");
  });
});

describe("isTrainSeatBookable", () => {
  it("blocks danger for non-agent", () => {
    expect(isTrainSeatBookable("danger", false)).toBe(false);
    expect(isTrainSeatBookable("warning", false)).toBe(true);
    expect(isTrainSeatBookable("success", false)).toBe(true);
    expect(isTrainSeatBookable("secondary", false)).toBe(true);
  });

  it("allows agent to book danger seats (legacy keeps bookInfo)", () => {
    expect(isTrainSeatBookable("warning", true)).toBe(true);
    expect(isTrainSeatBookable("danger", true)).toBe(true);
  });
});

describe("buildTrainPolicyParams", () => {
  it("collects TravelFromId from passenger travelFormId", () => {
    const params = buildTrainPolicyParams({
      trains: [
        {
          TrainNo: "G1",
          TrainCode: "G1",
          StartTime: "2026-06-22 09:00",
          ArrivalTime: "2026-06-22 13:28",
          FromStation: "北京南",
          ToStation: "上海虹桥",
          Seats: [{ SeatTypeName: "二等座", Price: 553 }],
        },
      ],
      passengers: [
        {
          id: "p1",
          passenger: { Id: "p1", AccountId: "acc-1", travelFormId: "tf-100" },
          credential: { Id: "c1", AccountId: "acc-1" },
        },
      ] as never,
    });

    expect(params?.TravelFromId).toBe("tf-100");
    expect(params?.Passengers).toBe("acc-1");
  });
});

describe("trainPolicyButtonClassName", () => {
  it("maps policy colors to button classes", () => {
    expect(trainPolicyButtonClassName("success")).toContain("34C759");
    expect(trainPolicyButtonClassName("warning")).toContain("FF8C00");
    expect(trainPolicyButtonClassName("danger")).toContain("EF4444");
    expect(trainPolicyButtonClassName("secondary")).toContain("5099fe");
  });
});
