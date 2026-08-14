import { afterEach, describe, expect, it, vi } from "vitest";
import type { TravelUrlRow } from "@ryx/shared-types";

const apiMocks = vi.hoisted(() => {
  const getTravelUrl = vi.fn();
  return {
    getTravelUrl,
    getApi: vi.fn(() => ({
      travel: { getTravelUrl },
    })),
  };
});

vi.mock("@/lib/api", () => ({
  getApi: apiMocks.getApi,
}));

import {
  buildPassengerOutNumberFields,
  buildTravelUrlRowSearchText,
  fetchTravelUrlOptions,
  filterTravelUrlRows,
  pickSoleTravelUrlNumber,
  resolveOutNumberValueFromTravelUrlRow,
  resolvePrefillTravelNumber,
  resolveTmcBookingConfig,
  unwrapTravelUrlRows,
} from "./flight-book-outnumber";

describe("buildPassengerOutNumberFields", () => {
  afterEach(() => {
    apiMocks.getApi.mockClear();
    apiMocks.getTravelUrl.mockReset();
  });

  it("enables canSelect only for TravelNumber when GetTravelUrl is on", () => {
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
      travelMode: "business",
    });

    expect(fields).toHaveLength(2);
    expect(fields.find((field) => field.key === "TravelNumber")?.canSelect).toBe(true);
    expect(fields.find((field) => field.key === "StaffNumber")?.canSelect).toBe(false);
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

  it("filters TravelNumber fields in personal mode", () => {
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
      travelNumber: "TR2026001",
      travelMode: "personal",
    });

    expect(fields).toHaveLength(1);
    expect(fields[0]?.key).toBe("StaffNumber");
    expect(fields.some((field) => field.isTravelNumber || field.key === "TravelNumber")).toBe(
      false,
    );
  });

  it("reads GetTravelUrl from Tmc.Variables JSON", () => {
    const fields = buildPassengerOutNumberFields({
      passenger: {
        id: "p1",
        passenger: { Id: "p1", Name: "张三", AccountId: "acc-1" },
        credential: { Id: "c1", Name: "张三", Number: "110101199001011234", CredentialsType: 1 },
      },
      staff: { Number: "10001", OutNumber: "S001" },
      init: {
        Tmc: {
          Variables: JSON.stringify({ GetTravelUrl: "https://example.com/travel" }),
        },
      },
      travelMode: "business",
      travelType: "Train",
    });

    expect(fields).toHaveLength(1);
    expect(fields[0]?.key).toBe("TravelNumber");
    expect(fields[0]?.canSelect).toBe(true);
    expect(fields[0]?.travelType).toBe("Train");
  });

  it("merge Variables with top-level Tmc fields", () => {
    const config = resolveTmcBookingConfig({
      Variables: JSON.stringify({ OutNumberNameArray: ["TravelNumber"] }),
      GetTravelUrl: true,
    });
    expect(config.GetTravelUrl).toBe(true);
    expect(config.OutNumberNameArray).toEqual(["TravelNumber"]);
  });

  it("does not call GetTravelUrl when the field cannot select a business travel form", async () => {
    const rows = await fetchTravelUrlOptions({
      key: "TravelNumber",
      label: "出差单号",
      value: "",
      required: true,
      canSelect: false,
      isTravelNumber: true,
    });

    expect(rows).toEqual([]);
    expect(apiMocks.getApi).not.toHaveBeenCalled();
    expect(apiMocks.getTravelUrl).not.toHaveBeenCalled();
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

  it("filters by travel number, subject, trips, and dingtalk routes", () => {
    expect(filterTravelUrlRows(rows, "上海")).toHaveLength(1);
    expect(filterTravelUrlRows(rows, "TR20260615001")).toHaveLength(1);
    expect(filterTravelUrlRows(rows, "北京")).toHaveLength(1);
    expect(filterTravelUrlRows(rows, "")).toHaveLength(2);
    expect(
      filterTravelUrlRows(
        [
          {
            TravelNumber: "TR-XM",
            DingTalkTravels: [{ Departure: "厦门北", Arrival: "上海虹桥" }],
          },
        ],
        "厦门",
      ),
    ).toHaveLength(1);
  });
});

describe("unwrapTravelUrlRows", () => {
  it("unwraps nested and direct response shapes", () => {
    const row = { TravelNumber: "TR001" };
    expect(unwrapTravelUrlRows({ value: { Data: [row] } })).toEqual([row]);
    expect(unwrapTravelUrlRows({ Data: [row] })).toEqual([row]);
    expect(unwrapTravelUrlRows([row])).toEqual([row]);
  });
});

describe("buildTravelUrlRowSearchText", () => {
  it("includes dingtalk departure and arrival", () => {
    const text = buildTravelUrlRowSearchText({
      TravelNumber: "TR001",
      DingTalkTravels: [{ Departure: "厦门北", Arrival: "上海虹桥" }],
    });
    expect(text).toContain("厦门北");
    expect(text).toContain("上海虹桥");
  });
});

describe("resolveOutNumberValueFromTravelUrlRow", () => {
  it("returns TravelNumber from row", () => {
    expect(
      resolveOutNumberValueFromTravelUrlRow({ TravelNumber: "TR001" } satisfies TravelUrlRow),
    ).toBe("TR001");
  });
});

describe("resolvePrefillTravelNumber", () => {
  it("prefers TravelFrom over passenger.travelNumber", () => {
    expect(
      resolvePrefillTravelNumber(
        { TravelFrom: { TravelNumber: "TF-001" } },
        {
          id: "p1",
          passenger: { Id: "p1", Name: "张三", travelNumber: "TN-PASS" },
          credential: { Id: "c1", Name: "张三", Number: "1", CredentialsType: 1 },
        },
      ),
    ).toBe("TF-001");
  });

  it("falls back to passenger.travelNumber", () => {
    expect(
      resolvePrefillTravelNumber(undefined, {
        id: "p1",
        passenger: { Id: "p1", Name: "张三", travelNumber: "TN-PASS" },
        credential: { Id: "c1", Name: "张三", Number: "1", CredentialsType: 1 },
      }),
    ).toBe("TN-PASS");
  });
});

describe("pickSoleTravelUrlNumber", () => {
  it("returns TravelNumber only when GetTravelUrl has exactly one row", () => {
    expect(pickSoleTravelUrlNumber([])).toBe("");
    expect(
      pickSoleTravelUrlNumber([
        { TravelNumber: "Travel202608141132303157173" },
        { TravelNumber: "Travel202608141132303157174" },
      ]),
    ).toBe("");
    expect(pickSoleTravelUrlNumber([{ TravelNumber: "Travel202608141132303157173" }])).toBe(
      "Travel202608141132303157173",
    );
  });
});
