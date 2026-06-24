import { describe, expect, it, vi } from "vitest";
import type { FlightOutNumberField, TravelUrlRow } from "@ryx/shared-types";

import {
  buildPassengerOutNumberFields,
  filterTravelUrlRows,
  resolveOutNumberValueFromTravelUrlRow,
} from "./flight-book-outnumber";

describe("buildPassengerOutNumberFields", () => {
  it("enables canSelect for all out-number fields when GetTravelUrl is on", () => {
    const fields = buildPassengerOutNumberFields({
      passenger: {
        id: "p1",
        passenger: { Id: "p1", Name: "张三", AccountId: "acc-1" },
        credential: { Id: "c1", Name: "张三", Number: "110101199001011234", CredentialsType: 1 },
      },
      staff: { Number: "10001", OutNumber: "S001" },
      init: {
        Tmc: {
          GetTravelUrl: true,
          OutNumberNameArray: ["TravelNumber", "StaffNumber"],
        },
      },
    });

    expect(fields).toHaveLength(2);
    expect(fields.every((field) => field.canSelect)).toBe(true);
  });

  it("disables canSelect when travel number is prefilled from TravelFrom", () => {
    const fields = buildPassengerOutNumberFields({
      passenger: {
        id: "p1",
        passenger: { Id: "p1", Name: "张三", AccountId: "acc-1" },
        credential: { Id: "c1", Name: "张三", Number: "110101199001011234", CredentialsType: 1 },
      },
      init: {
        TravelFrom: { TravelNumber: "TR2026001" },
        Tmc: {
          GetTravelUrl: true,
          OutNumberNameArray: ["TravelNumber"],
        },
      },
      travelNumber: "TR2026001",
    });

    expect(fields[0]?.canSelect).toBe(false);
    expect(fields[0]?.value).toBe("TR2026001");
  });
});

describe("filterTravelUrlRows", () => {
  const rows: TravelUrlRow[] = [
    {
      TravelNumber: "TR20260615001",
      Subject: "北京出差",
      Trips: ["北京"],
    },
    {
      TravelNumber: "TR20260615002",
      Subject: "上海会议",
      Trips: ["上海"],
    },
  ];

  it("filters by travel number, subject, and trips", () => {
    expect(filterTravelUrlRows(rows, "上海")).toHaveLength(1);
    expect(filterTravelUrlRows(rows, "TR20260615001")).toHaveLength(1);
    expect(filterTravelUrlRows(rows, "北京")).toHaveLength(1);
    expect(filterTravelUrlRows(rows, "")).toHaveLength(2);
  });
});

describe("resolveOutNumberValueFromTravelUrlRow", () => {
  it("returns TravelNumber from row", () => {
    expect(
      resolveOutNumberValueFromTravelUrlRow({ TravelNumber: "TR001" } satisfies TravelUrlRow),
    ).toBe("TR001");
  });
});
