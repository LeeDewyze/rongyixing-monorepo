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

const applicationMocks = vi.hoisted(() => ({
  getTicket: vi.fn(() => "ticket-1"),
  fetchMyTravelApplicationPickerItems: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  getApi: apiMocks.getApi,
}));

vi.mock("@/lib/session", () => ({
  getTicket: applicationMocks.getTicket,
}));

vi.mock("@/lib/travel-form-list", () => ({
  fetchMyTravelApplicationPickerItems: applicationMocks.fetchMyTravelApplicationPickerItems,
}));

import {
  buildPassengerOutNumberFields,
  buildTravelUrlRowSearchText,
  fetchTravelUrlOptions,
  filterTravelUrlRows,
  formatTravelUrlRowReason,
  formatTravelUrlRowTripItems,
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
    applicationMocks.getTicket.mockClear();
    applicationMocks.getTicket.mockReturnValue("ticket-1");
    applicationMocks.fetchMyTravelApplicationPickerItems.mockReset();
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
  it("sends the legacy book-page GetTravelUrl payload", async () => {
    apiMocks.getTravelUrl.mockResolvedValue({
      value: { Data: [{ TravelNumber: "TravelTmc" }] },
    });
    const fields = buildPassengerOutNumberFields({
      passenger: {
        id: "p1",
        passenger: { Id: "p1", Name: "孙雪", AccountId: "staff-account" },
        credential: {
          Id: "c1",
          AccountId: "72530000000029",
          Name: "孙雪",
          Number: "411521198811171528",
          CredentialsType: 1,
        },
      },
      staff: { Number: "3157173", OutNumber: "", Account: { Id: "operator-account" } },
      init: { Tmc: { GetTravelUrl: true, OutNumberNameArray: ["TravelNumber"] } },
      travelMode: "business",
      travelType: "Hotel",
    });

    await fetchTravelUrlOptions(fields[0]!);

    expect(apiMocks.getTravelUrl).toHaveBeenCalledWith({
      staffNumber: "3157173",
      staffOutNumber: null,
      name: null,
      travelType: "Hotel",
      outNumberName: "TravelNumber",
      accountId: "72530000000029",
    });
  });

  it("falls back staffNumber to staffOutNumber like legacy hotel book", async () => {
    apiMocks.getTravelUrl.mockResolvedValue({ value: { Data: [] } });

    await fetchTravelUrlOptions({
      key: "TravelNumber",
      label: "TravelNumber",
      value: "",
      required: true,
      canSelect: true,
      isTravelNumber: true,
      staffNumber: "",
      staffOutNumber: "OUT-113",
      accountId: "72530000000029",
      travelType: "Hotel",
    });

    expect(apiMocks.getTravelUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        staffNumber: "OUT-113",
        staffOutNumber: "OUT-113",
        name: null,
        accountId: "72530000000029",
      }),
    );
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

  it("lists 我的申请 travel numbers when GetTravelUrl has no rows", async () => {
    apiMocks.getTravelUrl.mockResolvedValue({ Data: {} });
    applicationMocks.fetchMyTravelApplicationPickerItems.mockResolvedValue([
      {
        id: "1",
        name: "出差申请",
        number: "Travel202609111640363157173",
        statusName: "审批通过",
        trips: [
          { fromCity: "北京", toCity: "杭州", startDate: "2026-09-21", endDate: "2026-09-21" },
        ],
      },
      { id: "2", name: "草稿", number: "TravelDraft", statusName: "草稿", trips: [] },
    ]);

    const rows = await fetchTravelUrlOptions({
      key: "TravelNumber",
      label: "TravelNumber",
      value: "",
      required: true,
      canSelect: true,
      isTravelNumber: true,
      staffNumber: "3157173",
      travelType: "Flight",
    });

    expect(rows).toEqual([
      {
        TravelFormId: "1",
        TravelNumber: "Travel202609111640363157173",
        Subject: "出差申请",
        Status: "审批通过",
        StartDate: "2026-09-21",
        EndDate: "2026-09-21",
        Trips: ["北京 → 杭州"],
        DingTalkTravels: [
          {
            Departure: "北京",
            Arrival: "杭州",
            StartTime: "2026-09-21",
            EndTime: "2026-09-21",
          },
        ],
      },
    ]);
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
    expect(unwrapTravelUrlRows({ value: [row] })).toEqual([row]);
    expect(unwrapTravelUrlRows({ data: [row] })).toEqual([row]);
    expect(unwrapTravelUrlRows({})).toEqual([]);
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

describe("formatTravelUrlRowTripItems", () => {
  it("keeps each trip's route and date separate", () => {
    expect(
      formatTravelUrlRowTripItems({
        TravelNumber: "Travel1",
        DingTalkTravels: [
          { Departure: "北京", Arrival: "杭州", StartTime: "2026-09-21", EndTime: "2026-09-22" },
        ],
      }),
    ).toEqual([{ route: "北京 → 杭州", date: "2026-09-21 ~ 2026-09-22" }]);
    expect(
      formatTravelUrlRowTripItems({
        TravelNumber: "Travel2",
        DingTalkTravels: [
          { Departure: "南京", Arrival: "长沙", StartTime: "2026-08-05", EndTime: "2026-08-06" },
          { Departure: "武汉", Arrival: "厦门", StartTime: "2026-08-05", EndTime: "2026-08-06" },
        ],
      }),
    ).toEqual([
      { route: "南京 → 长沙", date: "2026-08-05 ~ 2026-08-06" },
      { route: "武汉 → 厦门", date: "2026-08-05 ~ 2026-08-06" },
    ]);
  });
});

describe("formatTravelUrlRowReason", () => {
  it("hides the generic travel form title", () => {
    expect(formatTravelUrlRowReason("出差申请")).toBe("");
    expect(formatTravelUrlRowReason("出差申请 · 项目出差")).toBe("项目出差");
  });
});
