import { describe, expect, it } from "vitest";
import type { HotelDetailResponse } from "@ryx/shared-types";

import {
  buildHotelPolicyRoomPlansPayload,
  buildPolicyColorMap,
  getHotelPlanBookButtonPresentation,
  isHotelPlanBookable,
  policyItemMatchesPlanUniqueId,
} from "./hotel-book-policy";

const DETAIL: HotelDetailResponse = {
  HotelId: "H1",
  HotelName: "Test",
  CheckInDate: "2026-06-24",
  CheckOutDate: "2026-06-25",
  CityCode: "010",
  Rooms: [
    {
      RoomId: "R1",
      RoomName: "大床",
      Plans: [
        {
          PlanId: "P1",
          PlanName: "含早",
          Price: 500,
          LegacyId: "0",
          SupplierType: 2,
          TotalAmount: 500,
          Number: 3,
          RoomPlanUniqueId: "uniq-a",
        },
      ],
    },
    {
      RoomId: "R2",
      RoomName: "双床",
      Plans: [
        {
          PlanId: "P2",
          PlanName: "含早",
          Price: 500,
          LegacyId: "legacy-2",
          SupplierType: 4,
          TotalAmount: 500,
          Number: 1,
          RoomPlanUniqueId: "uniq-a",
        },
      ],
    },
  ],
};

describe("buildHotelPolicyRoomPlansPayload", () => {
  it("dedupes by RoomPlanUniqueId and maps legacy Id/SupplierType rules", () => {
    const payload = buildHotelPolicyRoomPlansPayload(DETAIL);
    expect(payload).toHaveLength(1);
    expect(payload[0]).toMatchObject({
      TotalAmount: 500,
      Number: 3,
      BeginDate: "2026-06-24T00:00:00",
      EndDate: "2026-06-25T00:00:00",
      Room: { Id: "R1" },
      SupplierType: 2,
      SupplierNumber: "",
    });
    expect(payload[0].Id).toBeUndefined();
  });

  it("uses legacy Id when not zero and always includes SupplierType 4", () => {
    const detail: HotelDetailResponse = {
      ...DETAIL,
      Rooms: [
        {
          RoomId: "R9",
          RoomName: "协议房",
          Plans: [
            {
              PlanId: "P9",
              PlanName: "协议价",
              Price: 400,
              LegacyId: "LP9",
              SupplierType: 4,
              RoomPlanUniqueId: "uniq-protocol",
            },
          ],
        },
      ],
    };
    const payload = buildHotelPolicyRoomPlansPayload(detail);
    expect(payload[0]).toMatchObject({
      Id: "LP9",
      SupplierType: 4,
      Room: { Id: "R9" },
    });
  });

  it("preserves opaque SupplierNumber string and legacy date format", () => {
    const detail: HotelDetailResponse = {
      ...DETAIL,
      CheckInDate: "2026-06-26",
      CheckOutDate: "2026-06-27",
      Rooms: [
        {
          RoomId: "196354",
          RoomName: "大床",
          Plans: [
            {
              PlanId: "P1",
              PlanName: "含早",
              Price: 540,
              LegacyId: "0",
              SupplierType: "Dttrip",
              TotalAmount: 540,
              Number: "",
              SupplierNumber: "RM1008773489DPRS24754919_8FE52E35AC3FE08F0B1B1ABB1E7DE831",
              BeginDate: "2026-06-26T00:00:00",
              EndDate: "2026-06-27T00:00:00",
              RoomPlanUniqueId: "uniq-dttrip",
            },
          ],
        },
      ],
    };
    const payload = buildHotelPolicyRoomPlansPayload(detail);
    expect(payload[0]).toEqual({
      TotalAmount: 540,
      Number: "",
      SupplierNumber: "RM1008773489DPRS24754919_8FE52E35AC3FE08F0B1B1ABB1E7DE831",
      BeginDate: "2026-06-26T00:00:00",
      EndDate: "2026-06-27T00:00:00",
      Room: { Id: 196354 },
      SupplierType: "Dttrip",
    });
  });
});

describe("policyItemMatchesPlanUniqueId", () => {
  it("matches direct UniqueIdId", () => {
    expect(
      policyItemMatchesPlanUniqueId({ UniqueIdId: "uniq-a", IsAllowBook: true }, "uniq-a"),
    ).toBe(true);
  });

  it("ignores SupplierNumber — does not concatenate", () => {
    expect(
      policyItemMatchesPlanUniqueId(
        { UniqueIdId: "rate-abc", SupplierNumber: 12, IsAllowBook: false },
        "rate-abc12",
      ),
    ).toBe(false);
  });
});

describe("buildPolicyColorMap", () => {
  it("maps UniqueIdId to policy colors for selected passenger", () => {
    const detail: HotelDetailResponse = {
      ...DETAIL,
      Rooms: [
        {
          RoomId: "R1",
          RoomName: "大床",
          Plans: [
            {
              PlanId: "P1",
              PlanName: "含早",
              Price: 500,
              RoomPlanUniqueId: "uniq-a",
            },
            {
              PlanId: "P3",
              PlanName: "无早",
              Price: 600,
              RoomPlanUniqueId: "uniq-b",
            },
          ],
        },
      ],
    };
    const colors = buildPolicyColorMap({
      results: [
        {
          PassengerKey: "acc-1",
          HotelPolicies: [
            { UniqueIdId: "uniq-a", IsAllowBook: true },
            { UniqueIdId: "uniq-b", IsAllowBook: false, Rules: ["超出差标"] },
          ],
        },
      ],
      filterPassengerId: "p1",
      passengers: [
        {
          id: "p1",
          passenger: { Id: "acc-1", AccountId: "acc-1", Name: "张三" },
          credential: { Id: "c1", Name: "张三", Type: 1, Number: "1234" },
        },
      ],
      detail,
    });
    expect(colors["uniq-a"]).toBe("success");
    expect(colors["uniq-b"]).toBe("danger_disabled");
  });

  it("does not match composite UniqueIdId + SupplierNumber to RoomPlanUniqueId", () => {
    // Legacy ryx does NOT concatenate SupplierNumber; composite match is rejected.
    const colors = buildPolicyColorMap({
      results: [
        {
          PassengerKey: "acc-1",
          HotelPolicies: [
            { UniqueIdId: "rate-x", SupplierNumber: 7, IsAllowBook: false, Rules: ["超出差标"] },
          ],
        },
      ],
      filterPassengerId: null,
      passengers: [
        {
          id: "p1",
          passenger: { Id: "acc-1", AccountId: "acc-1", Name: "张三" },
          credential: { Id: "c1", Name: "张三", Type: 1, Number: "1234" },
        },
      ],
      detail: {
        ...DETAIL,
        Rooms: [
          {
            RoomId: "R1",
            RoomName: "大床",
            Plans: [
              {
                PlanId: "P1",
                PlanName: "含早",
                Price: 565,
                SupplierNumber: 7,
                RoomPlanUniqueId: "rate-x7",
              },
            ],
          },
        ],
      },
    });
    // ryx legacy: no match -> plan gets default bookable fill (omitted-row default).
    expect(colors["rate-x7"]).toBe("success");
  });

  it("defaults missing policy rows to success when passenger entry exists", () => {
    const detail: HotelDetailResponse = {
      ...DETAIL,
      Rooms: [
        {
          RoomId: "R1",
          RoomName: "大床",
          Plans: [
            {
              PlanId: "P1",
              PlanName: "含早",
              Price: 500,
              RoomPlanUniqueId: "uniq-a",
            },
            {
              PlanId: "P3",
              PlanName: "无早",
              Price: 400,
              RoomPlanUniqueId: "uniq-missing",
            },
          ],
        },
      ],
    };
    const colors = buildPolicyColorMap({
      results: [
        {
          PassengerKey: "acc-1",
          HotelPolicies: [{ UniqueIdId: "uniq-a", IsAllowBook: true }],
        },
      ],
      filterPassengerId: null,
      passengers: [
        {
          id: "p1",
          passenger: { Id: "acc-1", AccountId: "acc-1", Name: "张三" },
          credential: { Id: "c1", Name: "张三", Type: 1, Number: "1234" },
        },
      ],
      detail,
    });
    expect(colors["uniq-a"]).toBe("success");
    expect(colors["uniq-missing"]).toBe("success");
  });

  it("uses FullHouseOrCanBook for full and no-permission overrides", () => {
    const colors = buildPolicyColorMap({
      results: [
        {
          PassengerKey: "acc-1",
          HotelPolicies: [{ UniqueIdId: "uniq-a", IsAllowBook: true }],
        },
      ],
      filterPassengerId: null,
      passengers: [
        {
          id: "p1",
          passenger: { Id: "acc-1", AccountId: "acc-1", Name: "张三" },
          credential: { Id: "c1", Name: "张三", Type: 1, Number: "1234" },
        },
      ],
      detail: {
        ...DETAIL,
        Rooms: [
          {
            RoomId: "R1",
            RoomName: "大床",
            Plans: [
              {
                PlanId: "P1",
                PlanName: "含早",
                Price: 500,
                RoomPlanUniqueId: "uniq-a",
                VariablesObj: { FullHouseOrCanBook: "full" },
              },
            ],
          },
        ],
      },
    });
    expect(colors["uniq-a"]).toBe("danger_full");
  });

  it("defaults all plans to success when passenger policy entry is missing", () => {
    const colors = buildPolicyColorMap({
      results: [
        {
          PassengerKey: "other-acc",
          HotelPolicies: [{ UniqueIdId: "uniq-a", IsAllowBook: false }],
        },
      ],
      filterPassengerId: null,
      passengers: [
        {
          id: "p1",
          passenger: { Id: "acc-1", AccountId: "acc-1", Name: "张三" },
          credential: { Id: "c1", Name: "张三", Type: 1, Number: "1234" },
        },
      ],
      detail: DETAIL,
    });
    expect(colors["uniq-a"]).toBe("success");
  });
});

describe("getHotelPlanBookButtonPresentation", () => {
  it("shows legacy exceed labels for danger_disabled", () => {
    const button = getHotelPlanBookButtonPresentation("danger_disabled", false, "预付");
    expect(button.topLabel).toBe("超标");
    expect(button.bottomLabel).toBe("不可预订");
    expect(button.disabled).toBe(true);
  });

  it("keeps exceed labels when booking override is true", () => {
    const button = getHotelPlanBookButtonPresentation("danger_disabled", true, "预付", true);
    expect(button.topLabel).toBe("超标");
    expect(button.bottomLabel).toBe("不可预订");
    expect(button.disabled).toBe(false);
  });

  it("shows book labels for success", () => {
    const button = getHotelPlanBookButtonPresentation("success", true, "预付");
    expect(button.topLabel).toBe("预订");
    expect(button.bottomLabel).toBe("预付");
    expect(button.disabled).toBe(false);
  });
});

describe("isHotelPlanBookable", () => {
  it("blocks non-agents on danger colors", () => {
    expect(isHotelPlanBookable("danger_full", false)).toBe(false);
    expect(isHotelPlanBookable("success", false)).toBe(true);
    expect(isHotelPlanBookable("danger_full", true)).toBe(false);
    expect(isHotelPlanBookable("danger_disabled", true)).toBe(true);
  });

  it("treats missing color as not bookable after policy check", () => {
    expect(isHotelPlanBookable(undefined, false, true)).toBe(false);
    expect(isHotelPlanBookable(undefined, false, false)).toBe(false);
  });
});
