import { describe, expect, it } from "vitest";

import {
  adaptFlightDetailResponse,
  applyLegacyInitDetailResult,
  formatCabinTypeName,
  normalizeFlightDetailResponse,
  selectCabinsForSegment,
} from "./flight-detail-adapter.js";

describe("adaptFlightDetailResponse", () => {
  it("unwraps Result and normalizes camelCase keys", () => {
    const result = adaptFlightDetailResponse({
      result: {
        flightFares: [
          {
            salesPrice: "360",
            flightFareBasics: [
              {
                cabinCode: "T",
                cabinType: 1,
                discount: 0.22,
              },
            ],
            variables: { baggage: "托运行李20KG" },
            count: "5",
          },
        ],
        flightSegments: [{ number: "CA1501" }],
      },
    });

    expect(result.FlightFares?.[0]?.SalesPrice).toBe("360");
    expect(result.FlightFares?.[0]?.FlightFareBasics?.[0]?.CabinCode).toBe("T");
    expect(result.FlightFares?.[0]?.Count).toBe("5");
    expect(result.FlightSegments?.[0]?.Number).toBe("CA1501");
  });
});

describe("applyLegacyInitDetailResult", () => {
  it("mirrors initDetailResult Variables and CabinTypeName enrichment", () => {
    const fare = applyLegacyInitDetailResult({
      Variables: JSON.stringify({ Baggage: "托运行李20KG", FlightNumber: "CA1501" }),
      FlightFareBasics: [{ CabinCode: "T", CabinType: 1, Discount: 0.22 }],
    });

    expect(fare.VariablesObj?.Baggage).toBe("托运行李20KG");
    expect(fare.Variables).toEqual({ Baggage: "托运行李20KG", FlightNumber: "CA1501" });
    expect(fare.FlightNumber).toBe("CA1501");
    expect(fare.FlightFareBasics?.[0]?.CabinTypeName).toBe(formatCabinTypeName(1));
  });

  it("parses FlightFareRules VariablesObj Details like legacy", () => {
    const fare = applyLegacyInitDetailResult({
      FlightFareRules: [
        {
          Name: "退票费",
          Variables: { Rate: "20%" },
        },
      ],
    });

    expect(fare.FlightFareRules?.[0]?.VariablesObj?.Details).toEqual([
      { name: "Rate", value: "20%" },
    ]);
  });
});

describe("normalizeFlightDetailResponse", () => {
  it("normalizes all fares after adapting payload", () => {
    const result = normalizeFlightDetailResponse({
      FlightFares: [
        {
          FlightFareBasics: [{ CabinCode: "Z", CabinType: 1, Discount: 0.22 }],
          Count: 5,
          Variables: { Baggage: "托运行李20KG" },
        },
      ],
    });

    expect(result.FlightFares?.[0]?.FlightFareBasics?.[0]?.CabinTypeName).toBe("经济舱");
    expect(result.FlightFares?.[0]?.Variables).toEqual({ Baggage: "托运行李20KG" });
  });

  it("maps KN5977 Home-Detail fare fields for cabin list row", () => {
    const result = normalizeFlightDetailResponse({
      FlightFares: [
        {
          SalesPrice: 330,
          Count: 5,
          Variables: { FlightNumber: "KN5977" },
          FlightFareBasics: [
            {
              CabinCode: "Z",
              CabinType: 1,
              CabinTypeAttach: "经济舱",
              Discount: 0.2,
              Count: 5,
            },
          ],
          FlightFareRules: [
            {
              Name: "托运行李额",
              Description: "1件,每件23KG,体积不超过40*60*100cm",
            },
          ],
        },
      ],
    });

    const fare = result.FlightFares?.[0]!;
    expect(fare.FlightNumber).toBe("KN5977");
    expect(fare.Count).toBe(5);
    expect(fare.VariablesObj?.Baggage).toBe("1件,每件23KG,体积不超过40*60*100cm");
    expect(fare.FlightFareBasics?.[0]?.CabinTypeAttach).toBe("经济舱");
    expect(fare.FlightFareBasics?.[0]?.Discount).toBe(0.2);
  });
});

describe("selectCabinsForSegment", () => {
  it("filters fares by Variables.FlightNumber like legacy replaceOldFlightSegmentInfo", () => {
    const result = normalizeFlightDetailResponse({
      FlightFares: [
        {
          SalesPrice: 330,
          Variables: { FlightNumber: "KN5977" },
          FlightFareBasics: [{ CabinCode: "Z", CabinTypeAttach: "经济舱", Discount: 0.2 }],
        },
        {
          SalesPrice: 999,
          Variables: { FlightNumber: "CA9999" },
          FlightFareBasics: [{ CabinCode: "Y" }],
        },
      ],
    });
    const cabins = selectCabinsForSegment(result, "KN5977");
    expect(cabins).toHaveLength(1);
    expect(cabins[0]?.SalesPrice).toBe(330);
  });
});
