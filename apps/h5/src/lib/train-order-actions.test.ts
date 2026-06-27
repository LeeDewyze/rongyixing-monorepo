import { describe, expect, it } from "vitest";

import {
  mergeTrainFooterActions,
  resolveTrainCountdownLabel,
} from "./train-order-actions";

describe("train-order-actions", () => {
  it("merges ticket refund and exchange flags into footer actions", () => {
    const merged = mergeTrainFooterActions(
      { showPay: false, showCancel: false, showIssue: false, smsAction: "none" },
      {
        Id: "1",
        Key: "k1",
        Trips: [],
        Actions: { showRefund: true, showExchange: true },
      },
    );

    expect(merged.showRefund).toBe(true);
    expect(merged.showExchange).toBe(true);
  });

  it("uses issue countdown copy for pending issue orders", () => {
    expect(
      resolveTrainCountdownLabel({
        showPay: false,
        showCancel: true,
        showIssue: true,
        smsAction: "none",
      }),
    ).toEqual({ prefix: "订单将在", suffix: "后关闭" });
  });

  it("uses pay countdown copy when pay is required", () => {
    expect(
      resolveTrainCountdownLabel({
        showPay: true,
        showCancel: true,
        smsAction: "none",
      }),
    ).toEqual({ prefix: "支付剩余", suffix: "" });
  });
});
