import { describe, expect, it } from "vitest";

import type { TrainOrderTrip } from "@ryx/shared-types";

import {
  formatTrainOrderSeatAssignment,
  formatTrainOrderSeatTypeLabel,
  resolveTrainOrderSeatLetter,
} from "./train-order-seat";

const baseTrip: TrainOrderTrip = {
  FromStationName: "北京南",
  ToStationName: "上海虹桥",
};

describe("train-order-seat", () => {
  it("prefers SeatTypeName for seat class label", () => {
    expect(
      formatTrainOrderSeatTypeLabel({
        trip: {
          ...baseTrip,
          SeatTypeName: "二等座",
          SeatName: "01A号 二等座",
        },
      }),
    ).toBe("二等座");
  });

  it("reads seat class from ticket-level SeatTypeName", () => {
    expect(
      formatTrainOrderSeatTypeLabel({
        trip: baseTrip,
        ticket: { SeatTypeName: "二等座", Detail: "06车01A号" },
      }),
    ).toBe("二等座");
  });

  it("extracts seat class from SeatName when SeatTypeName is missing", () => {
    expect(
      formatTrainOrderSeatTypeLabel({
        trip: {
          ...baseTrip,
          SeatName: "01A号 二等座",
        },
      }),
    ).toBe("二等座");
  });

  it("resolves seat letter from ticket Detail and trip SeatNo", () => {
    expect(
      resolveTrainOrderSeatLetter({
        trip: baseTrip,
        ticket: { Detail: "06车01A号" },
      }),
    ).toBe("A");
    expect(resolveTrainOrderSeatLetter({ trip: { ...baseTrip, SeatNo: "001A" } })).toBe("A");
    expect(
      resolveTrainOrderSeatLetter({ trip: { ...baseTrip, SeatName: "06车 01A号 二等座" } }),
    ).toBe("A");
  });

  it("formats coach and seat assignment", () => {
    expect(
      formatTrainOrderSeatAssignment({
        trip: {
          ...baseTrip,
          CoachNo: "06",
          SeatNo: "01A",
        },
      }),
    ).toBe("06车01A");

    expect(
      formatTrainOrderSeatAssignment({
        trip: baseTrip,
        ticket: { Detail: "06车01A号" },
      }),
    ).toBe("06车01A号");
  });
});
