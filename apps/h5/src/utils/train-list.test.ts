import { describe, expect, it } from "vitest";

import type { TrainItem } from "@ryx/shared-types";

import {
  applyTrainFilters,
  applyTrainTypeFilter,
  createInitialTrainFilter,
  formatSeatAvailability,
  formatSeatTypeDisplayName,
  formatTrainClock,
  formatTrainDuration,
  formatTrainDurationMinutes,
  getTrainArrivalDayTip,
  getDefaultSortedTrains,
  getTrainListItemKey,
  getTrainTravelMinutes,
  enrichTrainItem,
  isHighSpeedTrain,
  isRegularTrain,
  isTrainFilterActive,
  markLowestPrice,
  parseDurationMinutes,
  reorderTrainsByIds,
  resolveTrainListOrder,
  sortTrains,
  toggleTrainTimeSpan,
  TRAIN_FILTER_TIME_SPANS,
} from "./train-list";

const sampleTrains: TrainItem[] = [
  {
    Id: "1",
    TrainCode: "G1",
    StartTime: "2026-06-22 14:00",
    ArrivalTime: "2026-06-22 18:28",
    FromStation: "北京南",
    ToStation: "上海虹桥",
    Duration: "4小时28分",
    LowestPrice: 553,
    Seats: [{ SeatTypeName: "二等座", Count: 99 }],
  },
  {
    Id: "2",
    TrainCode: "K101",
    StartTime: "2026-06-22 09:00",
    ArrivalTime: "2026-06-23 00:45",
    FromStation: "北京",
    ToStation: "上海",
    Duration: "15小时45分",
    LowestPrice: 189,
    Seats: [{ SeatTypeName: "硬座", Count: 2 }],
  },
];

describe("train-list utils", () => {
  it("detects high-speed and regular train codes", () => {
    expect(isHighSpeedTrain("G1")).toBe(true);
    expect(isHighSpeedTrain("D7889")).toBe(true);
    expect(isRegularTrain("K101")).toBe(true);
    expect(isRegularTrain("G1")).toBe(false);
  });

  it("filters by train type", () => {
    expect(applyTrainTypeFilter(sampleTrains, "highSpeed")).toHaveLength(1);
    expect(applyTrainTypeFilter(sampleTrains, "regular")).toHaveLength(1);
    expect(applyTrainTypeFilter(sampleTrains, "regular")[0]?.TrainCode).toBe("K101");
  });

  it("sorts by default departure time ascending", () => {
    const sorted = getDefaultSortedTrains(sampleTrains);
    expect(sorted[0]?.TrainCode).toBe("K101");
    expect(sorted[1]?.TrainCode).toBe("G1");
  });

  it("sorts by price and duration", () => {
    expect(sortTrains(sampleTrains, "price", true)[0]?.TrainCode).toBe("K101");
    expect(sortTrains(sampleTrains, "duration", true)[0]?.TrainCode).toBe("G1");
    expect(sortTrains(sampleTrains, "duration", false)[0]?.TrainCode).toBe("K101");
  });

  it("sorts shortest duration with legacy 时/分 labels", () => {
    const trains: TrainItem[] = [
      {
        Id: "t1",
        TrainCode: "D1006",
        StartTime: "2026-06-22 05:50:00",
        ArrivalTime: "2026-06-22 12:00:00",
        FromStation: "北京",
        ToStation: "上海",
        Duration: "6小时10分",
        LowestPrice: 75.5,
      },
      {
        Id: "t2",
        TrainCode: "D1006",
        StartTime: "2026-06-22 06:00:00",
        ArrivalTime: "2026-06-22 12:00:00",
        FromStation: "北京南",
        ToStation: "上海",
        Duration: "6时",
        LowestPrice: 50.5,
      },
      {
        Id: "t3",
        TrainCode: "D7901",
        StartTime: "2026-06-22 07:00:00",
        ArrivalTime: "2026-06-22 12:00:00",
        FromStation: "北京西",
        ToStation: "上海",
        Duration: "5时",
        LowestPrice: 37,
      },
      {
        Id: "t4",
        TrainCode: "D7901",
        StartTime: "2026-06-22 07:21:00",
        ArrivalTime: "2026-06-22 12:00:00",
        FromStation: "北京",
        ToStation: "上海",
        Duration: "4时39分",
        LowestPrice: 40,
      },
    ];

    expect(sortTrains(trains, "duration", true).map((t) => t.Id)).toEqual(["t4", "t3", "t2", "t1"]);
    expect(getTrainTravelMinutes(trains[3]!)).toBe(279);
    expect(getTrainTravelMinutes(trains[0]!)).toBe(370);
  });

  it("sorts shortest duration when trains share train code but have unique ids", () => {
    const trains: TrainItem[] = [
      {
        Id: "D1006|BXP|2026-06-22 05:50:00",
        TrainCode: "D1006",
        StartTime: "2026-06-22 05:50:00",
        ArrivalTime: "2026-06-22 12:00:00",
        FromStation: "北京",
        ToStation: "上海",
        Duration: "6时10分",
        LowestPrice: 75.5,
      },
      {
        Id: "D1006|VNP|2026-06-22 06:00:00",
        TrainCode: "D1006",
        StartTime: "2026-06-22 06:00:00",
        ArrivalTime: "2026-06-22 12:00:00",
        FromStation: "北京南",
        ToStation: "上海",
        Duration: "6时",
        LowestPrice: 50.5,
      },
      {
        Id: "D7901|BXP|2026-06-22 07:21:00",
        TrainCode: "D7901",
        StartTime: "2026-06-22 07:21:00",
        ArrivalTime: "2026-06-22 12:00:00",
        FromStation: "北京",
        ToStation: "上海",
        Duration: "4时39分",
        LowestPrice: 40,
      },
      {
        Id: "D7889|BXP|2026-06-22 09:00:00",
        TrainCode: "D7889",
        StartTime: "2026-06-22 09:00:00",
        ArrivalTime: "2026-06-22 12:00:00",
        FromStation: "北京",
        ToStation: "上海",
        Duration: "3时",
        LowestPrice: 0,
      },
    ];

    expect(sortTrains(trains, "duration", true).map((t) => t.StartTime)).toEqual([
      "2026-06-22 09:00:00",
      "2026-06-22 07:21:00",
      "2026-06-22 06:00:00",
      "2026-06-22 05:50:00",
    ]);
  });

  it("resolves duration from TravelTime when duration text is missing", () => {
    const trains: TrainItem[] = [
      {
        ...sampleTrains[0]!,
        Id: "short",
        TrainCode: "G1",
        Duration: undefined,
        TravelTime: 268,
      },
      {
        ...sampleTrains[1]!,
        Id: "long",
        TrainCode: "K101",
        Duration: undefined,
        TravelTime: 945,
      },
    ];
    expect(sortTrains(trains, "duration", true).map((t) => t.TrainCode)).toEqual(["G1", "K101"]);
    expect(sortTrains(trains, "duration", false).map((t) => t.TrainCode)).toEqual(["K101", "G1"]);
    expect(getTrainTravelMinutes(trains[0]!)).toBe(268);
    expect(enrichTrainItem(trains[1]!).DurationMinutes).toBe(945);
  });

  it("cycles duration sort short then long", () => {
    const trains: TrainItem[] = [
      {
        Id: "t1",
        TrainCode: "D1006",
        StartTime: "2026-06-22 05:50:00",
        ArrivalTime: "2026-06-22 12:00:00",
        FromStation: "北京",
        ToStation: "上海",
        Duration: "6时10分",
        LowestPrice: 75.5,
      },
      {
        Id: "t4",
        TrainCode: "D7901",
        StartTime: "2026-06-22 07:21:00",
        ArrivalTime: "2026-06-22 12:00:00",
        FromStation: "北京",
        ToStation: "上海",
        Duration: "4时39分",
        LowestPrice: 40,
      },
    ];

    const baseState = {
      activeTab: "duration" as const,
      timeEarlyToLate: true,
      priceLowToHigh: true,
    };

    const shortest = resolveTrainListOrder(trains, {
      ...baseState,
      durationSortMode: "short",
    });
    expect(shortest.map((train) => train.Id)).toEqual(["t4", "t1"]);

    const longest = resolveTrainListOrder(trains, {
      ...baseState,
      durationSortMode: "long",
    });
    expect(longest.map((train) => train.Id)).toEqual(["t1", "t4"]);

    const defaultOrder = resolveTrainListOrder(trains, {
      activeTab: "none",
      durationSortMode: "off",
      timeEarlyToLate: true,
      priceLowToHigh: true,
    });
    expect(defaultOrder.map((train) => train.Id)).toEqual(["t1", "t4"]);
  });

  it("sorts longest duration before lowest-price short trips", () => {
    const trains: TrainItem[] = [
      {
        Id: "G6705|VNP|SHH|2026-06-22 09:00:00|2026-06-22 12:00:00",
        TrainCode: "G6705",
        StartTime: "2026-06-22 09:00:00",
        ArrivalTime: "2026-06-22 12:00:00",
        FromStation: "北京南",
        ToStation: "上海",
        Duration: "3时",
        LowestPrice: 0,
      },
      {
        Id: "K|BJP|SHH|2026-06-22 19:32:00|2026-06-23 09:00:00",
        TrainCode: "K101",
        StartTime: "2026-06-22 19:32:00",
        ArrivalTime: "2026-06-23 09:00:00",
        FromStation: "北京南",
        ToStation: "上海虹桥",
        Duration: "61时28分",
        ArriveDays: 3,
        LowestPrice: 518.5,
      },
    ];

    const sorted = resolveTrainListOrder(trains, {
      activeTab: "duration",
      durationSortMode: "long",
      timeEarlyToLate: true,
      priceLowToHigh: true,
    });
    expect(sorted[0]?.TrainCode).toBe("K101");
    expect(getTrainListItemKey(sorted[0]!, 0)).not.toBe(getTrainListItemKey(sorted[1]!, 1));
  });

  it("marks lowest price without reordering", () => {
    const marked = markLowestPrice(getDefaultSortedTrains(sampleTrains));
    expect(marked.find((t) => t.TrainCode === "K101")?.isLowestPrice).toBe(true);
    expect(marked[0]?.TrainCode).toBe("K101");
  });

  it("formats clock and seat availability", () => {
    expect(formatTrainClock("2026-06-22 09:00")).toBe("09:00");
    expect(formatTrainClock("2026-06-22T09:00:00")).toBe("09:00");
    expect(formatSeatAvailability(99)).toEqual({ text: "有票", scarce: false });
    expect(formatSeatAvailability(2)).toEqual({ text: "剩2张", scarce: true });
    expect(formatSeatAvailability(0)).toEqual({ text: "无票", scarce: false });
    expect(formatSeatTypeDisplayName("硬座")).toBe("硬座");
    expect(formatSeatTypeDisplayName("硬")).toBe("硬座");
  });

  it("shows arrival day tip for next-day trains", () => {
    expect(
      getTrainArrivalDayTip({
        Id: "1",
        TrainCode: "D329",
        StartTime: "2026-06-22 17:00:00",
        ArrivalTime: "2026-06-23 05:20:00",
        FromStation: "北京南",
        ToStation: "上海虹桥",
        ArriveDays: 1,
      }),
    ).toBe("+1天");

    expect(
      getTrainArrivalDayTip({
        Id: "2",
        TrainCode: "G1",
        StartTime: "2026-06-22 09:00:00",
        ArrivalTime: "2026-06-22 13:28:00",
        FromStation: "北京南",
        ToStation: "上海虹桥",
      }),
    ).toBeNull();
  });

  it("parses Chinese duration strings", () => {
    expect(parseDurationMinutes("4小时28分")).toBe(268);
    expect(parseDurationMinutes("15小时45分")).toBe(945);
    expect(parseDurationMinutes("11时20分")).toBe(680);
    expect(parseDurationMinutes("6时10分")).toBe(370);
  });

  it("formats duration labels for list cards", () => {
    expect(formatTrainDurationMinutes(370)).toBe("6时10分");
    expect(formatTrainDurationMinutes(680)).toBe("11时20分");
    expect(formatTrainDurationMinutes(45)).toBe("45分");
    expect(formatTrainDurationMinutes(60)).toBe("1时0分");
    expect(formatTrainDurationMinutes(1200)).toBe("20时0分");
    expect(
      formatTrainDuration({
        Id: "1",
        TrainCode: "G1",
        StartTime: "2026-06-22 09:00",
        ArrivalTime: "2026-06-22 13:28",
        FromStation: "北京南",
        ToStation: "上海虹桥",
        Duration: "4小时28分",
      }),
    ).toBe("4时28分");
  });

  it("filters only trains with tickets", () => {
    const filter = {
      ...createInitialTrainFilter(),
      onlyHasTickets: true,
    };
    const result = applyTrainFilters(
      [
        ...sampleTrains,
        {
          ...sampleTrains[1]!,
          Id: "3",
          TrainCode: "T10",
          Seats: [{ SeatTypeName: "硬座", Count: 0 }],
        },
      ],
      filter,
    );
    expect(result.map((t) => t.TrainCode)).toEqual(["G1", "K101"]);
  });

  it("filters by legacy-aligned departure and arrival time spans", () => {
    const morningTrain: TrainItem = {
      ...sampleTrains[1]!,
      Id: "morning",
      StartTime: "2026-06-22 09:00",
      ArrivalTime: "2026-06-22 11:30",
    };
    const eveningTrain: TrainItem = {
      ...sampleTrains[0]!,
      Id: "evening",
      StartTime: "2026-06-22 19:00",
      ArrivalTime: "2026-06-22 23:30",
    };
    const trains = [morningTrain, eveningTrain];

    const departureFilter = {
      ...createInitialTrainFilter(),
      departureTimeSpan: TRAIN_FILTER_TIME_SPANS[0]!.value,
    };
    expect(applyTrainFilters(trains, departureFilter).map((t) => t.Id)).toEqual(["morning"]);

    const arrivalFilter = {
      ...createInitialTrainFilter(),
      arrivalTimeSpan: TRAIN_FILTER_TIME_SPANS[2]!.value,
    };
    expect(applyTrainFilters(trains, arrivalFilter).map((t) => t.Id)).toEqual(["evening"]);
  });

  it("toggles time span selection", () => {
    const span = TRAIN_FILTER_TIME_SPANS[1]!.value;
    expect(toggleTrainTimeSpan(null, span)).toEqual(span);
    expect(toggleTrainTimeSpan(span, span)).toBeNull();
  });

  it("detects active filters including arrival time", () => {
    expect(isTrainFilterActive(createInitialTrainFilter())).toBe(false);
    expect(
      isTrainFilterActive({
        ...createInitialTrainFilter(),
        arrivalTimeSpan: TRAIN_FILTER_TIME_SPANS[0]!.value,
      }),
    ).toBe(true);
  });
});
