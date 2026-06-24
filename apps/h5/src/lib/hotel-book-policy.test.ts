import { describe, expect, it } from "vitest";
import type { HotelDetailResponse } from "@ryx/shared-types";

import {
  buildHotelPolicyRoomPlansPayload,
  buildPolicyColorMap,
  isHotelPlanBookable,
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
      BeginDate: "2026-06-24",
      EndDate: "2026-06-25",
      Room: { Id: "R1" },
      SupplierType: 2,
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
});

describe("buildPolicyColorMap", () => {
  it("maps UniqueIdId to policy colors for selected passenger", () => {
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
      detail: DETAIL,
    });
    expect(colors["uniq-a"]).toBe("success");
    expect(colors["uniq-b"]).toBe("danger_disabled");
  });
});

describe("isHotelPlanBookable", () => {
  it("blocks non-agents on danger colors", () => {
    expect(isHotelPlanBookable("danger_full", false)).toBe(false);
    expect(isHotelPlanBookable("success", false)).toBe(true);
    expect(isHotelPlanBookable("danger_full", true)).toBe(false);
    expect(isHotelPlanBookable("danger_disabled", true)).toBe(true);
  });
});
