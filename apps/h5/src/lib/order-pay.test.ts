import { describe, expect, it, vi } from "vitest";

import {
  executeOrderPayFlow,
  formatPayHoldCountdown,
  requiresPersonalPayment,
  resolveCheckoutSuccessMessage,
  resolvePayCreateOutTradeNo,
  resolvePayFailureMessage,
  resolvePayHoldSeconds,
} from "./order-pay";
import { shouldNavigateToPay } from "./flight-book-check-pay";

describe("requiresPersonalPayment", () => {
  it("matches legacy person and credit pay types", () => {
    expect(requiresPersonalPayment(2)).toBe(true);
    expect(requiresPersonalPayment(4)).toBe(true);
    expect(requiresPersonalPayment(1)).toBe(false);
  });
});

describe("shouldNavigateToPay", () => {
  it("navigates for person or credit pay when checkPay is ready", () => {
    expect(shouldNavigateToPay({ travelPayType: 2, checkPayReady: true })).toBe(true);
    expect(shouldNavigateToPay({ travelPayType: 4, checkPayReady: true })).toBe(true);
    expect(shouldNavigateToPay({ travelPayType: 1, checkPayReady: true })).toBe(false);
    expect(shouldNavigateToPay({ travelPayType: 2, checkPayReady: false })).toBe(false);
  });
});

describe("formatPayHoldCountdown", () => {
  it("formats mm:ss", () => {
    expect(formatPayHoldCountdown(125)).toBe("02:05");
    expect(formatPayHoldCountdown(0)).toBe("00:00");
  });
});

describe("resolvePayHoldSeconds", () => {
  it("converts minutes to seconds", () => {
    expect(resolvePayHoldSeconds(20)).toBe(1200);
    expect(resolvePayHoldSeconds(0)).toBeNull();
  });
});

describe("resolveCheckoutSuccessMessage", () => {
  it("matches legacy checkout-success copy", () => {
    expect(
      resolveCheckoutSuccessMessage({ needsApproval: true, needsPay: true, paySucceeded: false }),
    ).toBe("您的订单需要审批，请于审批完成后到订单列表进行支付");
    expect(
      resolveCheckoutSuccessMessage({ needsApproval: false, needsPay: true, paySucceeded: false }),
    ).toBe("您的订单尚未支付，请您稍后到订单列表进行支付");
    expect(
      resolveCheckoutSuccessMessage({ needsApproval: false, needsPay: false, paySucceeded: false }),
    ).toBe("您的订单正在预订，稍后请至订单列表查询");
  });
});

describe("resolvePayCreateOutTradeNo", () => {
  it("prefers OutTradeNo then PayOrderId then Number", () => {
    expect(resolvePayCreateOutTradeNo({ OutTradeNo: "A" })).toBe("A");
    expect(resolvePayCreateOutTradeNo({ PayOrderId: "B" })).toBe("B");
    expect(resolvePayCreateOutTradeNo({ Number: "C" })).toBe("C");
  });
});

describe("resolvePayFailureMessage", () => {
  it("returns message when create status is false", () => {
    expect(resolvePayFailureMessage({ Status: false, Message: "余额不足" })).toBe("余额不足");
    expect(resolvePayFailureMessage({ Status: true })).toBeUndefined();
  });
});

describe("executeOrderPayFlow", () => {
  it("processes pay when create returns out trade no", async () => {
    const createPay = vi.fn().mockResolvedValue({ OutTradeNo: "PAY-1" });
    const processPay = vi.fn().mockResolvedValue({ Success: true });
    const result = await executeOrderPayFlow({
      orderId: "ORD-1",
      payType: "wechat",
      createPay,
      processPay,
    });
    expect(result.processed).toBe(true);
    expect(processPay).toHaveBeenCalledWith({ OutTradeNo: "PAY-1", Type: "wechat" });
  });
});
