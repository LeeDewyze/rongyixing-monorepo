import { describe, expect, it } from "vitest";
import type { FlightFare, FlightPolicyPassengerResult, PassengerBookInfo } from "@ryx/shared-types";

import { filterFlightFaresByPolicy, formatFlightCabinPolicyHint } from "@/lib/flight-cabin-policy";

const fares: FlightFare[] = [
  {
    Id: "fare-y",
    FlightNumber: "CA1501",
    Code: "Y",
    SalesPrice: "980",
    Count: "9",
  },
  {
    Id: "fare-t",
    FlightNumber: "CA1501",
    Code: "T",
    SalesPrice: "360",
    Count: "5",
  },
];

const passengers: PassengerBookInfo[] = [
  {
    id: "p1",
    passenger: { Id: "p1", Name: "申晓杰", AccountId: "acc-1" },
    credential: {
      Id: "c1",
      Name: "申晓杰",
      Number: "110101199001011234",
      CredentialsType: 1,
    },
  },
];

const policyResults: FlightPolicyPassengerResult[] = [
  {
    PassengerKey: "acc-1",
    FlightPolicies: [
      {
        Id: "fare-y",
        FlightNo: "CA1501",
        Rules: [],
        Descriptions: [],
        IsAllowBook: true,
      },
      {
        Id: "fare-t",
        FlightNo: "CA1501",
        Rules: ["超出经济舱标准"],
        Descriptions: ["建议选择更低价格舱位"],
        IsAllowBook: true,
      },
    ],
  },
];

describe("filterFlightFaresByPolicy", () => {
  it("returns all fares with default color when filter is off", () => {
    const rows = filterFlightFaresByPolicy({
      fares,
      policyResults,
      passengers,
      filterPassengerId: "p1",
      filterEnabled: false,
      flightNumber: "CA1501",
    });
    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.color === "default")).toBe(true);
  });

  it("filters and colors fares when filter is on", () => {
    const rows = filterFlightFaresByPolicy({
      fares,
      policyResults,
      passengers,
      filterPassengerId: "p1",
      filterEnabled: true,
      flightNumber: "CA1501",
    });
    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.fare.Code === "Y")?.color).toBe("success");
    expect(rows.find((row) => row.fare.Code === "T")?.color).toBe("warning");
  });

  it("keeps all detail fares visible when filter is on", () => {
    const rows = filterFlightFaresByPolicy({
      fares,
      policyResults: [
        {
          PassengerKey: "acc-1",
          FlightPolicies: [
            {
              Id: "C",
              FlightNo: "CA1501",
              IsAllowBook: false,
              Rules: ["违反舱位类别政策只能选择经济舱"],
            },
          ],
        },
      ],
      passengers,
      filterPassengerId: "p1",
      filterEnabled: true,
      flightNumber: "CA1501",
    });
    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.fare.Code === "Y" || row.fare.Code === "T")).toBe(true);
  });

  it("returns default rows when policy results are empty", () => {
    const rows = filterFlightFaresByPolicy({
      fares,
      policyResults: [],
      passengers,
      filterPassengerId: "p1",
      filterEnabled: true,
      flightNumber: "CA1501",
    });
    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.color === "default")).toBe(true);
  });

  it("marks non-bookable policy as danger", () => {
    const blocked: FlightPolicyPassengerResult[] = [
      {
        PassengerKey: "acc-1",
        FlightPolicies: [
          {
            Id: "fare-t",
            FlightNo: "CA1501",
            Rules: ["超标"],
            IsAllowBook: false,
          },
        ],
      },
    ];
    const rows = filterFlightFaresByPolicy({
      fares,
      policyResults: blocked,
      passengers,
      filterPassengerId: "p1",
      filterEnabled: true,
      flightNumber: "CA1501",
    });
    expect(rows.find((row) => row.fare.Code === "T")?.color).toBe("danger");
    expect(rows.find((row) => row.fare.Code === "T")?.isAllowBook).toBe(false);
  });

  it("does not duplicate the first fare when policy ids fail to match detail ids", () => {
    const mismatchedPolicies: FlightPolicyPassengerResult[] = [
      {
        PassengerKey: "acc-1",
        FlightPolicies: [
          { Id: "policy-z", FlightNo: "CA1501", Cabin: { Code: "Y", SalesPrice: "980" } },
          { Id: "policy-t", FlightNo: "CA1501", Cabin: { Code: "T", SalesPrice: "360" } },
          { Id: "policy-unknown", FlightNo: "CA1501" },
        ],
      },
    ];
    const rows = filterFlightFaresByPolicy({
      fares,
      policyResults: mismatchedPolicies,
      passengers,
      filterPassengerId: "p1",
      filterEnabled: true,
      flightNumber: "CA1501",
    });
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.fare.Code)).toEqual(["Y", "T"]);
    expect(new Set(rows.map((row) => row.fare.Code)).size).toBe(2);
  });

  it("formats policy hint from descriptions before rules", () => {
    expect(
      formatFlightCabinPolicyHint({
        Descriptions: ["违反舱位类别政策只能选择经济舱"],
        Rules: ["其他规则"],
      }),
    ).toBe("违反舱位类别政策只能选择经济舱");
  });

  it("colors blocked business cabin when policy id is cabin code", () => {
    const businessFare: FlightFare = {
      Id: "detail-c-1",
      FlightNumber: "CA1501",
      BookCode: "C",
      SalesPrice: "2600",
      Count: "5",
      FlightFareBasics: [{ CabinType: 2, CabinTypeName: "公务舱", CabinCode: "C", FareBasic: "C" }],
      VariablesObj: { BizCode: "detail-c-1", FareBasis: "C" },
    };
    const rows = filterFlightFaresByPolicy({
      fares: [...fares, businessFare],
      policyResults: [
        {
          PassengerKey: "acc-1",
          FlightPolicies: [
            {
              Id: "C",
              FlightNo: "CA1501",
              Rules: ["违反舱位类别政策只能选择经济舱"],
              Descriptions: ["违反舱位类别政策只能选择经济舱"],
              IsAllowBook: false,
            },
          ],
        },
      ],
      passengers,
      filterPassengerId: "p1",
      filterEnabled: true,
      flightNumber: "CA1501",
    });
    const businessRow = rows.find(
      (row) => row.fare.BookCode === "C" || row.fare.Id === "detail-c-1",
    );
    expect(businessRow?.color).toBe("danger");
    expect(businessRow?.isAllowBook).toBe(false);
    expect(businessRow?.policy).toBeDefined();
  });

  it("matches proxy fares by BookCode and BizCode id", () => {
    const businessFare: FlightFare = {
      Id: "f17ebc15f61940ae930e156124a9b538",
      BookCode: "C",
      SalesPrice: "2600",
      FlightFareBasics: [{ CabinCode: "C", CabinType: 2, FareBasic: "C" }],
      VariablesObj: { BizCode: "f17ebc15f61940ae930e156124a9b538", FareBasis: "C" },
    };
    const rows = filterFlightFaresByPolicy({
      fares: [businessFare],
      policyResults: [
        {
          PassengerKey: "acc-1",
          FlightPolicies: [
            {
              Id: "f17ebc15f61940ae930e156124a9b538",
              FlightNo: "CA1501",
              IsAllowBook: false,
              Rules: ["违反舱位类别政策只能选择经济舱"],
              Descriptions: ["违反舱位类别政策只能选择经济舱"],
            },
          ],
        },
      ],
      passengers,
      filterPassengerId: "p1",
      filterEnabled: true,
      flightNumber: "CA1501",
    });
    expect(rows[0]?.color).toBe("danger");
    expect(rows[0]?.policy).toBeDefined();
  });

  it("treats string IsAllowBook false as blocked", () => {
    const rows = filterFlightFaresByPolicy({
      fares,
      policyResults: [
        {
          PassengerKey: "acc-1",
          FlightPolicies: [
            {
              Id: "fare-t",
              FlightNo: "CA1501",
              IsAllowBook: "false" as unknown as boolean,
              Rules: ["超标"],
            },
          ],
        },
      ],
      passengers,
      filterPassengerId: "p1",
      filterEnabled: true,
      flightNumber: "CA1501",
    });
    expect(rows.find((row) => row.fare.Code === "T")?.color).toBe("danger");
    expect(rows.find((row) => row.fare.Code === "T")?.isAllowBook).toBe(false);
  });
});
