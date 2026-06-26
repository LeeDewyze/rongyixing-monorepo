import { describe, expect, it } from "vitest";

import type { CoercedFlightOrderDetail } from "@/lib/flight-order-detail";
import {
  formatPayHoldCountdownZh,
  resolveCancelTarget,
  shouldPollFlightOrderDetail,
  shouldShowFlightFooter,
} from "@/lib/flight-order-detail";

function makeDetail(ticketCount: number): CoercedFlightOrderDetail {
  const tickets = Array.from({ length: ticketCount }, (_, index) => ({
    Id: `T${index + 1}`,
    Key: `k${index + 1}`,
    StatusName: "预订成功",
    Trips: [],
  }));
  return {
    OrderId: "ORD-1",
    Tickets: tickets,
    BillItems: [],
    Actions: { showPay: true, showCancel: true, smsAction: "none" },
    ShowServiceFee: true,
  };
}

describe("resolveCancelTarget", () => {
  it("uses abolish order for a single ticket", () => {
    expect(resolveCancelTarget(makeDetail(1))).toEqual({ mode: "order", ticketId: "T1" });
  });

  it("uses abolish ticket on the last ticket when multiple", () => {
    expect(resolveCancelTarget(makeDetail(2))).toEqual({ mode: "ticket", ticketId: "T2" });
  });
});

describe("formatPayHoldCountdownZh", () => {
  it("formats mm分ss秒", () => {
    expect(formatPayHoldCountdownZh(481)).toBe("08分01秒");
    expect(formatPayHoldCountdownZh(0)).toBe("00分00秒");
  });
});

describe("shouldShowFlightFooter", () => {
  it("shows footer only while countdown is active", () => {
    const actions = { showPay: true, showCancel: true, smsAction: "none" as const };
    expect(shouldShowFlightFooter(actions, 120)).toBe(true);
    expect(shouldShowFlightFooter(actions, 0)).toBe(false);
    expect(shouldShowFlightFooter(actions, null)).toBe(false);
  });
});

describe("shouldPollFlightOrderDetail", () => {
  it("polls transitional order and ticket statuses", () => {
    expect(shouldPollFlightOrderDetail({ OrderId: "1", Status: "WaitPay" })).toBe(true);
    expect(
      shouldPollFlightOrderDetail({
        OrderId: "1",
        Tickets: [{ Id: "T1", Key: "k1", Status: "Issuing", Trips: [] }],
      }),
    ).toBe(true);
    expect(shouldPollFlightOrderDetail({ OrderId: "1", Status: "Completed" })).toBe(false);
  });
});
