import { describe, expect, it } from "vitest";

import {
  buildTrainScheduleParamsFromItem,
  formatScheduleClock,
  formatScheduleDisplayTime,
  formatScheduleStayTime,
  isScheduleRowActive,
} from "./train-schedule";

describe("train-schedule", () => {
  it("builds schedule params from list train item", () => {
    const params = buildTrainScheduleParamsFromItem(
      {
        Id: "g1",
        TrainCode: "G1",
        TrainNo: "2400000G1008",
        StartTime: "2026-06-22 09:00:00",
        ArrivalTime: "2026-06-22 13:28:00",
        FromStation: "北京南",
        ToStation: "上海虹桥",
        FromStationCode: "VNP",
        ToStationCode: "AOH",
      },
      "2026-06-22",
    );

    expect(params).toEqual({
      Date: "2026-06-22",
      TrainCode: "G1",
      TrainNo: "2400000G1008",
      FromStation: "VNP",
      ToStation: "AOH",
    });
  });

  it("formats ISO and clock schedule times", () => {
    expect(formatScheduleClock("2026-06-27T00:10:00")).toBe("00:10");
    expect(formatScheduleClock("2026-06-27 11:30:00")).toBe("11:30");
    expect(formatScheduleClock("09:35")).toBe("09:35");
    expect(formatScheduleDisplayTime("09:35")).toBe("09:35");
    expect(formatScheduleDisplayTime("  ")).toBe("");
  });

  it("matches legacy ryx active row by from/to station name", () => {
    const stop = { StationName: "北京南" };

    expect(isScheduleRowActive(stop, "北京南", "上海虹桥")).toBe(true);
    expect(isScheduleRowActive(stop, "清河", "上海虹桥")).toBe(false);
    expect(isScheduleRowActive({ StationName: "保定东" }, "北京南", "上海虹桥")).toBe(false);
    expect(formatScheduleStayTime("2分")).toBe("2分");
    expect(formatScheduleStayTime(undefined)).toBe("");
  });
});
