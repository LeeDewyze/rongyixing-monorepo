import { describe, expect, it } from "vitest";

import type { HotelOrderActionFlags } from "@ryx/shared-types";

import {
  coerceTrainOrderDetail,
  filterBillLinesForTicket,
  shouldPollTrainOrderDetail,
  shouldShowTrainFooter,
} from "./train-order-detail";

describe("train-order-detail", () => {
  it("filters bill lines by ticket key", () => {
    const lines = filterBillLinesForTicket(
      [
        { Key: "k1", Name: "票价", Amount: 233, Tag: "Train" },
        { Key: "k2", Name: "票价", Amount: 253, Tag: "Train" },
        { Key: "k1", Name: "服务费", Amount: 5, Tag: "ServiceFee" },
      ],
      "k1",
      true,
    );
    expect(lines).toHaveLength(2);
    expect(lines.every((line) => line.Key === "k1")).toBe(true);
  });

  it("shows footer for pending issue without pay countdown", () => {
    const actions: HotelOrderActionFlags = {
      showPay: false,
      showCancel: true,
      showIssue: true,
      smsAction: "none",
    };
    expect(shouldShowTrainFooter(actions, null)).toBe(true);
  });

  it("hides pay footer when countdown expired", () => {
    const actions: HotelOrderActionFlags = {
      showPay: true,
      showCancel: true,
      smsAction: "none",
    };
    expect(shouldShowTrainFooter(actions, 0)).toBe(false);
  });

  it("shows footer for refund and exchange actions", () => {
    const actions: HotelOrderActionFlags = {
      showPay: false,
      showCancel: false,
      showRefund: true,
      showExchange: true,
      smsAction: "none",
    };
    expect(shouldShowTrainFooter(actions, null)).toBe(true);
  });

  it("polls while order is wait pay", () => {
    const detail = coerceTrainOrderDetail({
      OrderId: "ORD-TRN-001",
      ProductType: "Train",
      Status: "WaitPay",
      Tickets: [{ Id: "1", Key: "k1", Trips: [], StatusName: "待出票" }],
    });
    expect(shouldPollTrainOrderDetail(detail)).toBe(true);
  });
});

describe("formatTrainOrderTripDuration", () => {
  it("formats RunTime and falls back to departure/arrival timestamps", async () => {
    const { formatTrainOrderTripDuration } = await import("./train-order-detail");

    expect(formatTrainOrderTripDuration({ RunTime: "11h20m" })).toBe("11时20分");
    expect(
      formatTrainOrderTripDuration({
        StartTime: "2026-06-27 00:10:00",
        ArrivalTime: "2026-06-27 11:30:00",
      }),
    ).toBe("11时20分");
  });
});
