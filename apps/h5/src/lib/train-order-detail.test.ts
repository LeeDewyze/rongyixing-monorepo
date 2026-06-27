import { describe, expect, it } from "vitest";

import type { HotelOrderActionFlags } from "@ryx/shared-types";

import {
  coerceTrainOrderDetail,
  filterBillLinesForTicket,
  formatTrainOrderHoldBannerMessage,
  resolveTrainTicketDisplayStatus,
  shouldPollTrainOrderDetail,
  shouldShowTrainFooter,
  shouldShowTrainOrderHoldBanner,
} from "./train-order-detail";

describe("train-order-detail", () => {
  it("prefers StatusName over AppStatusName like legacy train detail", () => {
    expect(
      resolveTrainTicketDisplayStatus({
        AppStatusName: "出票失败",
        StatusName: "废除",
      }),
    ).toBe("废除");
    expect(
      resolveTrainTicketDisplayStatus({
        AppStatusName: "待出票",
        StatusName: "预订成功",
        Status: "2",
      }),
    ).toBe("待出票");
    expect(resolveTrainTicketDisplayStatus({ StatusName: "预订成功" })).toBe("预订成功");
    expect(resolveTrainTicketDisplayStatus({ AppStatusName: "待出票" })).toBe("待出票");
  });

  it("formats pay hold banner copy", () => {
    expect(
      formatTrainOrderHoldBannerMessage(330, {
        showPay: true,
        showCancel: true,
        smsAction: "none",
      }),
    ).toBe("订单将在05分30秒后关闭，如需出行，请尽快提交");
  });

  it("shows hold banner while pay or issue hold is active", () => {
    expect(
      shouldShowTrainOrderHoldBanner(120, {
        showPay: true,
        showCancel: true,
        smsAction: "none",
      }),
    ).toBe(true);
    expect(
      shouldShowTrainOrderHoldBanner(0, { showPay: true, showCancel: true, smsAction: "none" }),
    ).toBe(false);
  });

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

  it("polls while ticket is abolishing after cancel", () => {
    const detail = coerceTrainOrderDetail({
      OrderId: "ORD-TRN-002",
      ProductType: "Train",
      Status: "Cancelled",
      Tickets: [{ Id: "1", Key: "k1", Trips: [], AppStatusName: "废除中", Status: "14" }],
    });
    expect(shouldPollTrainOrderDetail(detail)).toBe(true);
  });

  it("stops polling when ticket reaches terminal abolish state", () => {
    const detail = coerceTrainOrderDetail({
      OrderId: "ORD-TRN-003",
      ProductType: "Train",
      Status: "Cancelled",
      Tickets: [{ Id: "1", Key: "k1", Trips: [], StatusName: "废除" }],
    });
    expect(shouldPollTrainOrderDetail(detail)).toBe(false);
  });
});

describe("formatTrainOrderTripDuration", () => {
  it("formats RunTime and falls back to departure/arrival timestamps", async () => {
    const { formatTrainOrderTripDuration } = await import("./train-order-detail");

    expect(formatTrainOrderTripDuration({ RunTime: "11h20m" })).toBe("11时20分");
    expect(formatTrainOrderTripDuration({ RunTime: 680 })).toBe("11时20分");
    expect(
      formatTrainOrderTripDuration({
        StartTime: "2026-06-27 00:10:00",
        ArrivalTime: "2026-06-27 11:30:00",
      }),
    ).toBe("11时20分");
  });
});
