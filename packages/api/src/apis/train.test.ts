import { describe, expect, it } from "vitest";

import { TRAIN_FLOW_METHODS } from "../methods/train-flow.js";
import { createProxyClient } from "../proxy/proxy-client.js";
import { successResponse } from "../proxy/response-adapter.js";
import {
  createTrainApi,
  normalizeTrainSearchResponse,
  normalizeTrainExchangeInfo,
  normalizeTrainPassengerInfo,
  normalizeTrainBookResponse,
  normalizeTrainScheduleResponse,
} from "./train.js";

describe("normalizeTrainSearchResponse", () => {
  it("normalizes legacy TrainEntity[] payload", () => {
    const result = normalizeTrainSearchResponse([
      {
        TrainCode: "G1",
        TrainNo: "2400000G1008",
        FromStationName: "北京南",
        ToStationName: "上海虹桥",
        FromStationCode: "VNP",
        ToStationCode: "AOH",
        StartTime: "2026-06-22 09:00:00",
        ArrivalTime: "2026-06-22 13:28:00",
        TravelTimeName: "4h28m",
        Seats: [
          { SeatTypeName: "二等座", SalesPrice: "553", Count: 99 },
          { SeatTypeName: "一等座", SalesPrice: "933", Count: 20 },
        ],
      },
    ]);

    expect(result.Trains).toHaveLength(1);
    expect(result.Trains[0]).toMatchObject({
      TrainCode: "G1",
      FromStation: "北京南",
      ToStation: "上海虹桥",
      Duration: "4小时28分",
      DurationMinutes: 268,
      LowestPrice: 553,
      Seats: [
        { SeatTypeName: "二等座", Price: 553, Count: 99 },
        { SeatTypeName: "一等座", Price: 933, Count: 20 },
      ],
    });
  });

  it("maps legacy TravelTime minutes for duration sorting", () => {
    const result = normalizeTrainSearchResponse([
      {
        TrainCode: "K101",
        FromStationName: "北京",
        ToStationName: "上海",
        StartTime: "2026-06-22 22:30:00",
        ArrivalTime: "2026-06-23 14:15:00",
        TravelTime: 945,
        Seats: [{ SeatTypeName: "硬座", SalesPrice: "189", Count: 10 }],
      },
    ]);

    expect(result.Trains[0]).toMatchObject({
      TravelTime: 945,
      DurationMinutes: 945,
    });
  });

  it("parses TravelTimeName with 时/分 labels", () => {
    const result = normalizeTrainSearchResponse([
      {
        TrainCode: "D77",
        FromStationName: "北京",
        ToStationName: "上海",
        StartTime: "2026-06-22 08:00:00",
        ArrivalTime: "2026-06-22 19:20:00",
        TravelTimeName: "11时20分",
        Seats: [{ SeatTypeName: "二等座", SalesPrice: "100", Count: 10 }],
      },
    ]);

    expect(result.Trains[0]?.DurationMinutes).toBe(680);
  });

  it("uses min seat SalesPrice and ignores train LowestPrice (legacy sleeper)", () => {
    const result = normalizeTrainSearchResponse([
      {
        TrainCode: "D1043",
        FromStationName: "北京南",
        ToStationName: "上海虹桥",
        StartTime: "2026-06-22 20:47:00",
        ArrivalTime: "2026-06-23 02:16:00",
        LowestPrice: 573,
        Seats: [
          { SeatTypeName: "一等卧", SalesPrice: "0", TicketPrice: "800", Count: 5 },
          { SeatTypeName: "二等卧", SalesPrice: "0", TicketPrice: "573", Count: 10 },
        ],
      },
    ]);

    expect(result.Trains[0]?.LowestPrice).toBe(0);
    expect(result.Trains[0]?.Seats?.[0]?.Price).toBe(0);
  });

  it("maps sleeper berth prices from BedInfos", () => {
    const result = normalizeTrainSearchResponse([
      {
        TrainCode: "K101",
        FromStationName: "北京南",
        ToStationName: "上海",
        StartTime: "2026-06-22 22:30:00",
        ArrivalTime: "2026-06-23 14:15:00",
        Seats: [
          {
            SeatTypeName: "硬卧",
            SalesPrice: "227.5",
            Count: 12,
            BedInfos: [
              { BedTypeName: "上铺", BedTicketPrice: "210.5" },
              { BedTypeName: "中铺", BedTicketPrice: "218.5" },
              { BedTypeName: "下铺", BedTicketPrice: "227.5" },
            ],
          },
          {
            SeatTypeName: "软卧",
            SalesPrice: "364.5",
            Count: 2,
            BedInfos: [
              { BedTypeName: "上铺", BedTicketPrice: "340.5" },
              { BedTypeName: "下铺", BedTicketPrice: "364.5" },
            ],
          },
        ],
      },
    ]);

    expect(result.Trains[0]?.Seats?.[0]?.BedInfos).toEqual([
      { BedTypeName: "上铺", Price: 210.5 },
      { BedTypeName: "中铺", Price: 218.5 },
      { BedTypeName: "下铺", Price: 227.5 },
    ]);
    expect(result.Trains[0]?.Seats?.[1]?.BedInfos).toEqual([
      { BedTypeName: "上铺", Price: 340.5 },
      { BedTypeName: "下铺", Price: 364.5 },
    ]);
  });

  it("assigns unique ids for same train code at different departure times", () => {
    const result = normalizeTrainSearchResponse([
      {
        TrainCode: "D1006",
        FromStationCode: "BXP",
        StartTime: "2026-06-22 05:50:00",
        ArrivalTime: "2026-06-22 12:00:00",
        TravelTimeName: "6时10分",
        Seats: [{ SeatTypeName: "二等座", SalesPrice: "75.5", Count: 10 }],
      },
      {
        TrainCode: "D1006",
        FromStationCode: "VNP",
        StartTime: "2026-06-22 06:00:00",
        ArrivalTime: "2026-06-22 12:00:00",
        TravelTimeName: "6时",
        Seats: [{ SeatTypeName: "二等座", SalesPrice: "50.5", Count: 10 }],
      },
    ]);

    expect(result.Trains).toHaveLength(2);
    expect(result.Trains[0]?.Id).not.toBe(result.Trains[1]?.Id);
    expect(result.Trains[0]?.Id).toContain("D1006");
    expect(result.Trains[1]?.Id).toContain("06:00:00");
  });

  it("ignores duplicate API ids when building route-based ids", () => {
    const result = normalizeTrainSearchResponse([
      {
        Id: "same-server-id",
        TrainCode: "G6705",
        FromStationCode: "VNP",
        ToStationCode: "SHH",
        StartTime: "2026-06-22 09:00:00",
        ArrivalTime: "2026-06-22 12:00:00",
        TravelTimeName: "3时",
        Seats: [{ SeatTypeName: "二等座", SalesPrice: "0", Count: 10 }],
      },
      {
        Id: "same-server-id",
        TrainCode: "G6707",
        FromStationCode: "BXP",
        ToStationCode: "SHH",
        StartTime: "2026-06-22 09:00:00",
        ArrivalTime: "2026-06-22 12:00:00",
        TravelTimeName: "3时",
        Seats: [{ SeatTypeName: "二等座", SalesPrice: "0", Count: 10 }],
      },
    ]);

    expect(result.Trains[0]?.Id).not.toBe(result.Trains[1]?.Id);
    expect(result.Trains[0]?.Id).toContain("G6705");
    expect(result.Trains[1]?.Id).toContain("G6707");
  });

  it("keeps mock { Trains } payload", () => {
    const result = normalizeTrainSearchResponse({
      Trains: [
        {
          Id: "T1",
          TrainCode: "G3",
          StartTime: "2026-06-22 14:00",
          ArrivalTime: "2026-06-22 18:28",
          FromStation: "北京",
          ToStation: "上海",
          Duration: "4小时28分",
          LowestPrice: 553,
          Seats: [{ SeatTypeName: "二等座", Price: 553, Count: 50 }],
        },
      ],
    });

    expect(result.Trains).toHaveLength(1);
    expect(result.Trains[0]?.TrainCode).toBe("G3");
  });
});

describe("normalizeTrainExchangeInfo", () => {
  it("maps exchange search context", () => {
    expect(
      normalizeTrainExchangeInfo({
        TicketId: "207600000001",
        OrderId: "ORD-TRN-002",
        Date: "2026-06-28",
        FromStation: "VNP",
        ToStation: "AOH",
        FromStationName: "北京南",
        ToStationName: "上海虹桥",
      }),
    ).toMatchObject({
      TicketId: "207600000001",
      FromStationName: "北京南",
      ToStationName: "上海虹桥",
    });
  });
});

describe("normalizeTrainBookResponse", () => {
  it("maps numeric TradeNo to OrderId when OrderId is absent", () => {
    expect(
      normalizeTrainBookResponse({
        TradeNo: 20760000000204,
        Tickets: [{ TicketId: "20760000000258", Status: 1, Price: 164.5 }],
        TotalAmount: 164.5,
        HasTasks: false,
      }),
    ).toEqual({
      OrderId: "20760000000204",
      TradeNo: "20760000000204",
      HasTasks: false,
      IsCheckPay: undefined,
      OrderNumber: undefined,
    });
  });

  it("prefers explicit OrderId over TradeNo", () => {
    expect(
      normalizeTrainBookResponse({
        OrderId: "ORD-1",
        TradeNo: 99,
      }),
    ).toMatchObject({
      OrderId: "ORD-1",
      TradeNo: "99",
    });
  });
});

describe("normalizeTrainPassengerInfo", () => {
  it("maps refund passenger snapshot", () => {
    expect(
      normalizeTrainPassengerInfo({
        Passenger: { Name: "郭某某", Mobile: "13800000000" },
        Trip: { TrainCode: "D79", FromStationName: "北京南", ToStationName: "上海虹桥" },
      }),
    ).toMatchObject({
      Name: "郭某某",
      TrainCode: "D79",
      FromStationName: "北京南",
    });
  });
});

describe("normalizeTrainScheduleResponse", () => {
  it("normalizes legacy stop array", () => {
    const result = normalizeTrainScheduleResponse([
      {
        StationName: "北京南",
        ArriveTime: "09:00",
        DepartTime: "09:00",
        StopoverTime: "—",
      },
      {
        StationName: "上海虹桥",
        ArriveTime: "13:28",
        DepartTime: "13:28",
      },
    ]);

    expect(result.Stops).toHaveLength(2);
    expect(result.Stops[0]?.StationName).toBe("北京南");
  });

  it("unwraps legacy TrainEntity[].Schedules payload", () => {
    const result = normalizeTrainScheduleResponse([
      {
        TrainCode: "D1061",
        Schedules: [
          { StationName: "北京南", ArriveTime: "00:10", StartTime: "00:10", StayTime: "—" },
          { StationName: "上海虹桥", ArriveTime: "11:30", StartTime: "11:30", StayTime: "—" },
        ],
      },
    ]);

    expect(result.Stops).toHaveLength(2);
    expect(result.Stops[0]).toMatchObject({
      StationName: "北京南",
      ArriveTime: "00:10",
      DepartTime: "00:10",
    });
    expect(result.Stops[1]?.StationName).toBe("上海虹桥");
  });

  it("normalizes mock Stops envelope", () => {
    const result = normalizeTrainScheduleResponse({
      Stops: [{ StationName: "北京南", DepartTime: "09:00", ArriveTime: "09:00" }],
    });

    expect(result.Stops).toHaveLength(1);
    expect(result.Stops[0]?.StationName).toBe("北京南");
  });
});

describe("createTrainApi (mock mode)", () => {
  it("searchTrains sends legacy-aligned request payload", async () => {
    let capturedData: unknown;
    const proxy = createProxyClient({
      baseUrl: "https://example.com",
      mode: "mock",
      mockHandler: async (method, data) => {
        if (method === TRAIN_FLOW_METHODS.HOME_SEARCH) {
          capturedData = data;
          return successResponse([]);
        }
        return successResponse(null);
      },
    });
    const train = createTrainApi(proxy);

    await train.searchTrains({
      Date: "2026-06-22",
      FromStation: "BJP",
      ToStation: "SHH",
    });

    expect(capturedData).toMatchObject({
      Date: "2026-06-22",
      FromStation: "BJP",
      ToStation: "SHH",
      TrainCode: "",
    });
  });

  it("searchTrains normalizes array response", async () => {
    const proxy = createProxyClient({
      baseUrl: "https://example.com",
      mode: "mock",
      mockHandler: async (method) => {
        if (method === TRAIN_FLOW_METHODS.HOME_SEARCH) {
          return successResponse([
            {
              TrainCode: "G1",
              FromStationName: "北京南",
              ToStationName: "上海虹桥",
              StartTime: "2026-06-22 09:00:00",
              ArrivalTime: "2026-06-22 13:28:00",
              TravelTimeName: "4h28m",
              Seats: [{ SeatTypeName: "二等座", SalesPrice: "553", Count: 10 }],
            },
          ]);
        }
        return successResponse(null);
      },
    });
    const train = createTrainApi(proxy);

    const result = await train.searchTrains({
      Date: "2026-06-22",
      FromStation: "BJP",
      ToStation: "SHH",
    });

    expect(result.Trains).toHaveLength(1);
    expect(result.Trains[0]?.LowestPrice).toBe(553);
  });
});
