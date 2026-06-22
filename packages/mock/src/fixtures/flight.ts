import type { FlightDetailResult, FlightListResult, FlightSegment, Trafficline } from "@ryx/shared-types";

export const MOCK_AIRPORTS: Trafficline[] = [
  {
    Id: "9278",
    Tag: "AirportCity",
    Code: "BJS",
    Name: "北京",
    Nickname: "北京",
    Pinyin: "Beijing",
    Initial: "bj",
    AirportCityCode: "BJS",
    CityCode: "1101",
    CityName: "北京",
    EnglishName: "Beijing",
    CountryCode: "CN",
    IsHot: true,
  },
  {
    Id: "9280",
    Tag: "AirportCity",
    Code: "SHA",
    Name: "上海",
    Nickname: "上海",
    Pinyin: "Shanghai",
    Initial: "sh",
    AirportCityCode: "SHA",
    CityCode: "3101",
    CityName: "上海",
    EnglishName: "Shanghai",
    CountryCode: "CN",
    IsHot: true,
  },
  {
    Id: "9281",
    Tag: "Airport",
    Code: "PEK",
    Name: "首都国际机场",
    Nickname: "首都",
    Pinyin: "Capital Airport",
    Initial: "sd",
    AirportCityCode: "BJS",
    CityCode: "1101",
    CityName: "北京",
    EnglishName: "Capital Intl",
    CountryCode: "CN",
    IsHot: true,
  },
  {
    Id: "9282",
    Tag: "Airport",
    Code: "PVG",
    Name: "浦东国际机场",
    Nickname: "浦东",
    Pinyin: "Pudong Airport",
    Initial: "pd",
    AirportCityCode: "SHA",
    CityCode: "3101",
    CityName: "上海",
    EnglishName: "Pudong Intl",
    CountryCode: "CN",
    IsHot: true,
  },
  {
    Id: "9283",
    Tag: "AirportCity",
    Code: "CAN",
    Name: "广州",
    Nickname: "广州",
    Pinyin: "Guangzhou",
    Initial: "gz",
    AirportCityCode: "CAN",
    CityCode: "4401",
    CityName: "广州",
    EnglishName: "Guangzhou",
    CountryCode: "CN",
    IsHot: true,
  },
  {
    Id: "9284",
    Tag: "AirportCity",
    Code: "SZX",
    Name: "深圳",
    Nickname: "深圳",
    Pinyin: "Shenzhen",
    Initial: "sz",
    AirportCityCode: "SZX",
    CityCode: "4403",
    CityName: "深圳",
    EnglishName: "Shenzhen",
    CountryCode: "CN",
    IsHot: true,
  },
];

function buildSegments(params: {
  FromCode?: string;
  ToCode?: string;
  Date?: string;
}): FlightSegment[] {
  const date = params.Date ?? new Date().toISOString().slice(0, 10);
  const from = params.FromCode ?? "BJS";
  const to = params.ToCode ?? "SHA";

  return [
    {
      Id: "F001",
      Number: "CA1501",
      FlightNumber: "CA1501",
      Airline: "CA",
      AirlineName: "中国国航",
      FromAirport: from,
      FromAirportName: "首都T3",
      FromCityName: "北京",
      FromTerminal: "T3",
      ToAirport: to,
      ToAirportName: "虹桥T2",
      ToCityName: "上海",
      ToTerminal: "T2",
      TakeoffTime: `${date} 08:30:00`,
      ArrivalTime: `${date} 10:45:00`,
      FlyTime: "135",
      FlyTimeName: "2h15m",
      LowestFare: "980",
      Tax: "70",
      IsStop: false,
      IsAgreement: true,
      PlaneType: "空客A320",
      PlaneTypeDescribe: "空客A320(中)",
    },
    {
      Id: "F002",
      Number: "MU5101",
      FlightNumber: "MU5101",
      Airline: "MU",
      AirlineName: "东方航空",
      FromAirport: from,
      FromAirportName: "首都T2",
      FromCityName: "北京",
      FromTerminal: "T2",
      ToAirport: to,
      ToAirportName: "浦东T1",
      ToCityName: "上海",
      ToTerminal: "T1",
      TakeoffTime: `${date} 14:00:00`,
      ArrivalTime: `${date} 16:20:00`,
      FlyTime: "140",
      FlyTimeName: "2h20m",
      LowestFare: "860",
      Tax: "70",
      IsStop: false,
      RemainSeats: 2,
      PlaneType: "波音737",
      PlaneTypeDescribe: "波音737(中)",
    },
    {
      Id: "F003",
      Number: "CZ3101",
      FlightNumber: "CZ3101",
      Airline: "CZ",
      AirlineName: "南方航空",
      FromAirport: from,
      FromAirportName: "大兴",
      FromCityName: "北京",
      FromTerminal: "",
      ToAirport: to,
      ToAirportName: "虹桥T2",
      ToCityName: "上海",
      ToTerminal: "T2",
      TakeoffTime: `${date} 19:30:00`,
      ArrivalTime: `${date} 21:50:00`,
      FlyTime: "140",
      FlyTimeName: "2h20m",
      LowestFare: "720",
      Tax: "70",
      IsStop: true,
      PlaneType: "空客A321",
      PlaneTypeDescribe: "空客A321(中)",
    },
    {
      Id: "F005",
      Number: "MF8101",
      FlightNumber: "MF8101",
      Airline: "MF",
      AirlineName: "厦门航空",
      FromAirport: from,
      FromAirportName: "首都T2",
      FromCityName: "北京",
      ToAirport: to,
      ToAirportName: "虹桥T2",
      ToCityName: "上海",
      TakeoffTime: `${date} 09:00:00`,
      ArrivalTime: `${date} 14:30:00`,
      FlyTimeName: "5h30m",
      LowestFare: "650",
      IsTransfer: true,
      PlaneTypeDescribe: "空客320(中)",
      RemainSeats: 2,
    },
  ];
}

export function createMockFlightList(params: {
  FromCode?: string;
  ToCode?: string;
  Date?: string;
}): FlightListResult {
  const segments = buildSegments(params);
  return {
    Result: { FlightSegments: segments },
    FlightViews: segments.map((seg) => ({
      Price: seg.LowestFare,
      Data: seg.Data ?? `mock-${seg.Id}`,
      BookType: 2,
      Segment: {
        ...seg,
        DetailKey: seg.Data ?? `mock-${seg.Id}`,
        Data: seg.Data ?? `mock-${seg.Id}`,
        BookType: 2,
      },
    })),
  };
}

function mockCabinsForSegment(seg: FlightSegment) {
  const base = Number(seg.LowestFare ?? 720);
  return [
    {
      FlightNumber: seg.Number,
      Code: "Y",
      SalesPrice: String(base),
      Tax: seg.Tax ?? "70",
      IsAgreement: true,
      IsAllowOrder: true,
      Count: "9",
      FlightFareBasics: [
        {
          CabinCode: "Y",
          CabinType: 1,
          CabinTypeName: "经济舱",
          Discount: 0.45,
        },
      ],
      VariablesObj: { Baggage: "托运行李20KG" },
    },
    {
      FlightNumber: seg.Number,
      Code: "T",
      SalesPrice: "360",
      Tax: seg.Tax ?? "70",
      IsAllowOrder: true,
      Count: "5",
      FlightFareBasics: [
        {
          CabinCode: "T",
          CabinType: 1,
          CabinTypeName: "经济舱",
          Discount: 0.22,
        },
      ],
      VariablesObj: { Baggage: "托运行李20KG" },
    },
    {
      FlightNumber: seg.Number,
      Code: "M",
      SalesPrice: String(base + 120),
      Tax: seg.Tax ?? "70",
      IsAllowOrder: true,
      Count: "5",
      FlightFareBasics: [
        {
          CabinCode: "M",
          CabinType: 1,
          CabinTypeName: "经济舱",
          Discount: 0.65,
        },
      ],
      VariablesObj: { Baggage: "托运行李20KG" },
    },
    {
      FlightNumber: seg.Number,
      Code: "C",
      SalesPrice: String(base + 800),
      Tax: seg.Tax ?? "70",
      IsAllowOrder: true,
      Count: "2",
      FlightFareBasics: [
        {
          CabinCode: "C",
          CabinType: 2,
          CabinTypeName: "公务舱",
          Discount: 0.85,
        },
      ],
      VariablesObj: { Baggage: "托运行李30KG" },
    },
  ];
}

export function createMockFlightDetail(params: {
  FlightNumber?: string;
  FromCode?: string;
  ToCode?: string;
  Date?: string;
}): FlightDetailResult {
  const list = createMockFlightList({
    FromCode: params.FromCode,
    ToCode: params.ToCode,
    Date: params.Date,
  });
  const segments = list.Result?.FlightSegments ?? [];
  const flightNumber = (params.FlightNumber ?? "").toUpperCase();
  const segment =
    segments.find((s) => s.Number.toUpperCase() === flightNumber) ?? segments[0];
  if (!segment) {
    return { FlightSegments: [], FlightFares: [] };
  }
  return {
    FlightSegments: [{ ...segment }],
    FlightFares: mockCabinsForSegment(segment),
  };
}
