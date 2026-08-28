import type { OrderDetailProductType, ProductChannel } from "@ryx/shared-types";

import { getApi } from "@/lib/api";

const WECHAT_PAY_RESULT_NUMBER_KEY = "wechatPayResultNumber";
const PENDING_PAY_CONTEXT_KEY = "ryx_pending_pay_context";
export const PENDING_PAY_CONTEXT_TTL_MS = 15 * 60 * 1000;

export interface PendingPayContext {
  payType: string;
  channel?: ProductChannel;
  productType?: OrderDetailProductType;
  createdAt?: number;
}

/** Remember the selected pay channel before a whole-page /home/Pay redirect. */
export function savePendingPayContext(context: PendingPayContext): void {
  try {
    sessionStorage.setItem(
      PENDING_PAY_CONTEXT_KEY,
      JSON.stringify({ ...context, createdAt: Date.now() }),
    );
  } catch {
    // Ignore storage restrictions in embedded WebViews.
  }
}

export function clearPendingPayContext(): void {
  try {
    sessionStorage.removeItem(PENDING_PAY_CONTEXT_KEY);
  } catch {
    // Ignore storage restrictions in embedded WebViews.
  }
}

function readPendingPayContext(): PendingPayContext | null {
  try {
    const raw = sessionStorage.getItem(PENDING_PAY_CONTEXT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingPayContext;
    const createdAt = parsed?.createdAt;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.payType !== "string" ||
      typeof createdAt !== "number" ||
      !Number.isFinite(createdAt) ||
      createdAt <= 0
    ) {
      sessionStorage.removeItem(PENDING_PAY_CONTEXT_KEY);
      return null;
    }
    if (Date.now() - createdAt >= PENDING_PAY_CONTEXT_TTL_MS) {
      sessionStorage.removeItem(PENDING_PAY_CONTEXT_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function readPayResultNumber(): string {
  if (typeof window === "undefined") return "";
  return (
    new URLSearchParams(window.location.search).get(WECHAT_PAY_RESULT_NUMBER_KEY) ?? ""
  );
}

function cleanPayResultNumber(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.delete(WECHAT_PAY_RESULT_NUMBER_KEY);
  window.history.replaceState(
    window.history.state,
    "",
    `${url.pathname}${url.search}${url.hash}`,
  );
}

/**
 * Consume the legacy /home/Pay post-pay redirect marker before the router
 * mounts. The server redirects back to the H5 home with
 * `wechatPayResultNumber=<OutTradeNo>` (WeChat only — Alipay has no client-side
 * post-pay confirmation in legacy, it is settled server-side). Confirm the
 * payment with Pay-Process, preferring the channel/product type saved before
 * the redirect so tourist orders hit the tourist method. Returns true when a
 * pay-result marker was present and consumed.
 */
export async function bootstrapWechatPayResultCallback(): Promise<boolean> {
  const outTradeNo = readPayResultNumber();
  if (!outTradeNo) return false;
  const context = readPendingPayContext();
  let confirmed = false;
  try {
    const result = await getApi().pay.process({
      OutTradeNo: outTradeNo,
      Type: context?.payType ?? "3",
      ...(context?.channel ? { channel: context.channel } : {}),
      ...(context?.productType ? { ProductType: context.productType } : {}),
    });
    confirmed = result.Success !== false;
  } catch {
    // Confirmation is best-effort (payment is also settled server-side). Keep
    // the marker and context on failure so a refresh can retry.
  }
  if (confirmed) {
    clearPendingPayContext();
    cleanPayResultNumber();
  }
  return true;
}
