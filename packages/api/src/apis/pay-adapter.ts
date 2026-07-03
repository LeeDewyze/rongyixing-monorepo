import type { OrderPayChannel, PayCreateResponse } from "@ryx/shared-types";

/** Legacy PaylineType used by H5 personal pay: 2=支付宝, 3=微信, 7=工行。 */
export function resolveLegacyPayType(payType: string): string {
  const value = payType.trim().toLowerCase();
  if (/^\d+$/.test(value)) return value;
  if (value.includes("wechat") || value.includes("weixin")) return "3";
  if (value.includes("ali")) return "2";
  if (value.includes("icbc")) return "7";
  return payType;
}

export function isLegacyIcbcPayType(payType: string): boolean {
  return resolveLegacyPayType(payType) === "7";
}

export function normalizeOrderPayChannels(raw: unknown): OrderPayChannel[] {
  if (Array.isArray(raw)) {
    return raw.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const channel = item as Record<string, unknown>;
      const payType = String(channel.PayType ?? channel.value ?? channel.Type ?? "");
      const payTypeName = String(
        channel.PayTypeName ?? channel.label ?? channel.Name ?? payType,
      );
      if (!payType) return [];
      const normalized: OrderPayChannel = {
        PayType: payType,
        PayTypeName: payTypeName,
      };
      if (channel.Icon) {
        normalized.Icon = String(channel.Icon);
      }
      return [normalized];
    });
  }

  if (raw && typeof raw === "object") {
    return Object.entries(raw as Record<string, string>).map(([payType, payTypeName]) => ({
      PayType: payType,
      PayTypeName: payTypeName,
    }));
  }

  return [];
}

export function buildLegacyPayCreatePayload(input: {
  orderId: string;
  payType: string;
  key?: string;
}): Record<string, unknown> {
  if (isLegacyIcbcPayType(input.payType)) {
    return {
      Channel: "App",
      Type: 7,
      OrderId: input.orderId,
      IsApp: false,
    };
  }

  return {
    Channel: "App",
    Type: resolveLegacyPayType(input.payType),
    OrderId: input.orderId,
    IsApp: false,
    CreateType: "Mobile",
    DataType: "json",
    ...(input.key ? { Key: input.key } : {}),
  };
}

export function normalizePayCreateResponse(raw: unknown): PayCreateResponse {
  if (typeof raw === "string") {
    return { OutTradeNo: raw, PayOrderId: raw };
  }
  if (!raw || typeof raw !== "object") {
    return {};
  }
  const data = raw as Record<string, unknown>;
  const outTradeNo = data.OutTradeNo ?? data.Number ?? data.PayOrderId;
  const payUrl = data.PayUrl ?? data.Url ?? data.Body;
  return {
    ...(data as PayCreateResponse),
    PayOrderId: outTradeNo ? String(outTradeNo) : undefined,
    OutTradeNo: outTradeNo ? String(outTradeNo) : undefined,
    Number: data.Number ? String(data.Number) : undefined,
    PayUrl: payUrl ? String(payUrl) : undefined,
    Url: data.Url ? String(data.Url) : undefined,
    Status: typeof data.Status === "boolean" ? data.Status : undefined,
    Message: data.Message ? String(data.Message) : undefined,
  };
}

export function buildLegacyPayProcessPayload(input: {
  outTradeNo: string;
  payType: string;
}): Record<string, unknown> {
  return {
    OutTradeNo: input.outTradeNo,
    Type: resolveLegacyPayType(input.payType),
  };
}

export function resolvePayRedirectUrl(response: PayCreateResponse): string | undefined {
  const candidate = response.PayUrl ?? response.Url;
  if (!candidate) return undefined;
  if (candidate.startsWith("http://") || candidate.startsWith("https://")) {
    return candidate;
  }
  return undefined;
}
