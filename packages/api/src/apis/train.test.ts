import { describe, expect, it } from "vitest";

import { TRAIN_FLOW_METHODS } from "../methods/train-flow.js";
import { createProxyClient } from "../proxy/proxy-client.js";
import { successResponse } from "../proxy/response-adapter.js";
import { createTrainApi, normalizeTrainSearchResponse } from "./train.js";

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
      LowestPrice: 553,
      Seats: [
        { SeatTypeName: "二等座", Price: 553, Count: 99 },
        { SeatTypeName: "一等座", Price: 933, Count: 20 },
      ],
    });
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
