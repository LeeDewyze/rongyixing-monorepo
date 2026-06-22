import { describe, expect, it } from "vitest";

import type { TrainItem } from "@ryx/shared-types";

import {
  applyTrainFilters,
  applyTrainTypeFilter,
  createInitialTrainFilter,
  formatSeatAvailability,
  formatTrainClock,
  getTrainArrivalDayTip,
  getDefaultSortedTrains,
  isHighSpeedTrain,
  isRegularTrain,
  markLowestPrice,
  parseDurationMinutes,
  sortTrains,
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
});
