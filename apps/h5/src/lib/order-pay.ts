import type { PayCreateResponse } from "@ryx/shared-types";

import { FLIGHT_PAY_TYPE_CREDIT, FLIGHT_PAY_TYPE_PERSON } from "@/lib/flight-book-pay";

export function requiresPersonalPayment(travelPayType: number | null | undefined): boolean {
  return travelPayType === FLIGHT_PAY_TYPE_PERSON || travelPayType === FLIGHT_PAY_TYPE_CREDIT;
}

export function formatPayHoldCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function resolvePayHoldSeconds(payHoldTime?: number): number | null {
  if (typeof payHoldTime !== "number" || payHoldTime <= 0) return null;
  return Math.floor(payHoldTime * 60);
}

export function resolveCheckoutSuccessMessage(input: {
  needsApproval?: boolean;
  needsPay?: boolean;
  paySucceeded?: boolean;
}): string {
  const { needsApproval, needsPay, paySucceeded } = input;
  if (needsApproval) {
    if (needsPay && !paySucceeded) {
      return "您的订单需要审批，请于审批完成后到订单列表进行支付";
    }
    return "您的订单需要审批，稍后请至订单列表查询";
  }
  if (needsPay) {
    if (!paySucceeded) {
      return "您的订单尚未支付，请您稍后到订单列表进行支付";
    }
    return "您的订单正在预订，稍后请至订单列表查询";
  }
  return "您的订单正在预订，稍后请至订单列表查询";
}

export function resolvePayCreateOutTradeNo(response: PayCreateResponse): string | undefined {
  return response.OutTradeNo ?? response.PayOrderId ?? response.Number;
}

export function resolvePayFailureMessage(response: PayCreateResponse): string | undefined {
  if (response.Status === false) {
    return response.Message ?? "支付发起失败";
  }
  return undefined;
}

export async function executeOrderPayFlow(input: {
  orderId: string;
  payType: string;
  createPay: (params: { OrderId: string; PayType: string }) => Promise<PayCreateResponse>;
  processPay: (params: {
    OutTradeNo: string;
    Type: string;
  }) => Promise<{ Success?: boolean; Message?: string }>;
}): Promise<{ redirected: boolean; processed: boolean; message?: string }> {
  const createResult = await input.createPay({
    OrderId: input.orderId,
    PayType: input.payType,
  });
  const failureMessage = resolvePayFailureMessage(createResult);
  if (failureMessage) {
    throw new Error(failureMessage);
  }

  const redirectUrl = createResult.PayUrl ?? createResult.Url;
  if (redirectUrl?.startsWith("http")) {
    window.location.assign(redirectUrl);
    return { redirected: true, processed: false };
  }

  const outTradeNo = resolvePayCreateOutTradeNo(createResult);
  if (!outTradeNo) {
    return { redirected: false, processed: false, message: "支付已提交，请稍后在订单中查看状态" };
  }

  const processResult = await input.processPay({
    OutTradeNo: outTradeNo,
    Type: input.payType,
  });
  if (processResult.Success === false) {
    throw new Error(processResult.Message ?? "支付处理失败");
  }

  return { redirected: false, processed: true };
}
