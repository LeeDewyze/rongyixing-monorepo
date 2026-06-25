import { describe, expect, it } from "vitest";

import {
  buildFlightDetailParams,
  fareBaggageText,
  fareRemainCount,
  filterFaresForFlight,
  formatCabinDiscount,
  formatCabinInfoLine,
  formatFareSalesPrice,
  isEconomyFare,
  isFlightFareBookable,
  normalizeFlightDetailData,
  prepareFlightFareForDisplay,
  prepareFlightFareRulesForSheet,
  partitionCabinsByTab,
  resolveDetailSegment,
  shouldShowFareRemainCount,
} from "./flight-detail";

describe("resolveDetailSegment", () => {
  const baseQuery = {
    date: "2026-06-24",
    fromCode: "BJS",
    toCode: "SHA",
    fromName: "北京",
    toName: "上海",
    fromAsAirport: false,
    toAsAirport: false,
    flightNumber: "MU5176",
    fromAirport: "PKX",
    toAirport: "PVG",
    takeoffTime: "2026-06-24 22:40:00",
    arrivalTime: "2026-06-25 08:50:00",
    detailKey: "dk-transfer",
    bookType: "",
    airlineName: "东方航空",
    flyTimeName: "10小时10分",
    fromAirportName: "大兴国际机场",
    toAirportName: "浦东国际机场",
    fromTerminal: "",
    toTerminal: "T1",
    planeTypeDescribe: "空客A320(小)",
    meal: "N",
    airlineSrc: "",
  };

  it("keeps list overall route when detail returns first transfer leg", () => {
    const segment = resolveDetailSegment(baseQuery, {
      Number: "MU5176",
      FromCityName: "北京",
      ToCityName: "南昌",
      FromAirportName: "大兴国际机场",
      ToAirportName: "昌北国际机场",
      ToTerminal: "T2",
      TakeoffTime: "2026-06-24 22:40:00",
      ArrivalTime: "2026-06-25 00:50:00",
      FlyTimeName: "2小时10分",
    });

    expect(segment.ToCityName).toBe("上海");
    expect(segment.ToAirportName).toBe("浦东国际机场");
    expect(segment.ToTerminal).toBe("T1");
    expect(segment.ArrivalTime).toBe("2026-06-25 08:50:00");
    expect(segment.FlyTimeName).toBe("10小时10分");
  });
});

describe("buildFlightDetailParams", () => {
  it("uses airport codes and passenger count for Home-Detail", () => {
    expect(
      buildFlightDetailParams(
        {
          date: "2026-06-22",
          fromCode: "BJS",
          toCode: "SHA",
          fromName: "北京",
          toName: "上海",
          fromAsAirport: false,
          toAsAirport: false,
          flightNumber: "CA1501",
          fromAirport: "PEK",
          toAirport: "SHA",
          takeoffTime: "2026-06-22 08:30:00",
          arrivalTime: "2026-06-22 10:45:00",
          detailKey: "abc",
          bookType: "",
          airlineName: "",
          flyTimeName: "",
          fromAirportName: "",
          toAirportName: "",
          fromTerminal: "",
          toTerminal: "",
          planeTypeDescribe: "",
          meal: "",
          airlineSrc: "",
        },
        2,
      ),
    ).toEqual({
      Date: "2026-06-22",
      FromCode: "PEK",
      ToCode: "SHA",
      FlightNumber: "CA1501",
      FromAsAirport: false,
      ToAsAirport: false,
      ADTPtcs: 2,
      DetailKey: "abc",
      Lang: "cn",
    });
  });

  it("includes BookType when provided from list FlightViews", () => {
    const params = buildFlightDetailParams(
      {
        date: "2026-06-23",
        fromCode: "BJS",
        toCode: "SHA",
        fromName: "北京",
        toName: "上海",
        fromAsAirport: false,
        toAsAirport: false,
        flightNumber: "KN5977",
        fromAirport: "PKX",
        toAirport: "PVG",
        takeoffTime: "2026-06-23T20:50:00",
        arrivalTime: "2026-06-23T22:55:00",
        detailKey: "S05eNTk3N",
        bookType: "2",
        airlineName: "",
        flyTimeName: "",
        fromAirportName: "",
        toAirportName: "",
        fromTerminal: "",
        toTerminal: "",
        planeTypeDescribe: "",
        meal: "",
        airlineSrc: "",
      },
      1,
    );
    expect(params?.BookType).toBe("2");
    expect(params?.Lang).toBe("cn");
  });
});

describe("partitionCabinsByTab", () => {
  it("splits economy and business cabins", () => {
    const fares = [
      {
        SalesPrice: "500",
        FlightFareBasics: [{ CabinType: 1, CabinCode: "Y" }],
      },
      {
        SalesPrice: "1200",
        FlightFareBasics: [{ CabinType: 2, CabinCode: "C" }],
      },
    ];
    const grouped = partitionCabinsByTab(fares);
    expect(grouped.economy).toHaveLength(1);
    expect(grouped.business).toHaveLength(1);
    expect(isEconomyFare(fares[0]!)).toBe(true);
    expect(isEconomyFare(fares[1]!)).toBe(false);
  });
});

describe("filterFaresForFlight", () => {
  it("filters by flight number", () => {
    const fares = [
      { FlightNumber: "CA1501", SalesPrice: "100" },
      { FlightNumber: "MU5101", SalesPrice: "200" },
    ];
    expect(filterFaresForFlight(fares, "CA1501")).toHaveLength(1);
  });
});

describe("formatCabinDiscount", () => {
  it("formats fractional discount like legacy pipe", () => {
    expect(formatCabinDiscount(0.22)).toBe("2.2折");
    expect(formatCabinDiscount(0.45)).toBe("4.5折");
    expect(formatCabinDiscount(1)).toBe("全价");
  });
});

describe("formatCabinInfoLine", () => {
  it("matches legacy cabins list template", () => {
    expect(
      formatCabinInfoLine({
        FlightFareBasics: [
          {
            CabinCode: "T",
            CabinTypeName: "经济舱",
            Discount: 0.22,
          },
        ],
      }),
    ).toBe("T/经济舱2.2折");
  });

  it("uses CabinTypeAttach and Discount from Home-Detail basics", () => {
    expect(
      formatCabinInfoLine({
        FlightFareBasics: [
          {
            CabinCode: "Z",
            CabinTypeAttach: "经济舱",
            Discount: 0.2,
          },
        ],
      }),
    ).toBe("Z/经济舱2折");
  });

  it("derives cabin name from CabinType via initDetailResult", () => {
    expect(
      formatCabinInfoLine({
        FlightFareBasics: [{ CabinCode: "Y", CabinType: 1, Discount: 0.45 }],
      }),
    ).toBe("Y/经济舱4.5折");
  });
});

describe("fare baggage and remain count", () => {
  it("reads baggage injected from FlightFareRules", () => {
    const fare = prepareFlightFareForDisplay({
      FlightFareRules: [
        {
          Name: "托运行李额",
          Description: "1件,每件23KG,体积不超过40*60*100cm",
        },
      ],
      Variables: { FlightNumber: "KN5977" },
    });
    expect(fareBaggageText(fare)).toBe("1件,每件23KG,体积不超过40*60*100cm");
  });

  it("reads remain count from Cabin.Count", () => {
    const fare = prepareFlightFareForDisplay({ Count: 5 });
    expect(shouldShowFareRemainCount(fare)).toBe(true);
    expect(fareRemainCount(fare)).toBe(5);
  });

  it("formats sales price without decimals", () => {
    expect(formatFareSalesPrice(330.0)).toBe("330");
  });

  it("renders KN5977 Z cabin card fields from Home-Detail payload", () => {
    const detail = normalizeFlightDetailData({
      FlightFares: [
        {
          SalesPrice: "330",
          Count: 5,
          Discount: 0.2,
          Variables: { FlightNumber: "KN5977" },
          FlightFareBasics: [
            {
              CabinCode: "Z",
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
    const fare = detail.FlightFares?.[0]!;
    expect(formatCabinInfoLine(fare)).toBe("Z/经济舱2折");
    expect(fareBaggageText(fare)).toBe("1件,每件23KG,体积不超过40*60*100cm");
    expect(fareRemainCount(fare)).toBe(5);
    expect(shouldShowFareRemainCount(fare)).toBe(true);
  });
});

describe("prepareFlightFareRulesForSheet", () => {
  it("dedupes Tag and exposes VariablesObj.Details like legacy modal", () => {
    const fare = prepareFlightFareForDisplay({
      FlightFareRules: [
        {
          Name: "退票费",
          Tag: "北京-上海",
          Variables: {
            "2026年06月16日 20:50前": "￥33/人",
          },
        },
        {
          Name: "改期费",
          Tag: "北京-上海",
          Description: undefined,
          Variables: {
            "2026年06月16日 20:50前": "￥17/人",
          },
        },
        {
          Name: "托运行李额",
          Tag: "北京-上海",
          Description: "1件,每件23KG,体积不超过40*60*100cm",
        },
      ],
    });

    const rows = prepareFlightFareRulesForSheet(fare);
    expect(rows[0]?.Tag).toBe("北京-上海");
    expect(rows[1]?.Tag).toBeUndefined();
    expect(rows[0]?.Details?.[0]?.value).toBe("￥33/人");
    expect(rows[2]?.Description).toBe("1件,每件23KG,体积不超过40*60*100cm");
  });
});

describe("isFlightFareBookable", () => {
  it("allows fares with inventory even when IsAllowOrder is false", () => {
    expect(isFlightFareBookable({ Count: 4, IsAllowOrder: false })).toBe(true);
  });

  it("blocks sold-out fares", () => {
    expect(isFlightFareBookable({ Count: 0, IsAllowOrder: true })).toBe(false);
  });
});
