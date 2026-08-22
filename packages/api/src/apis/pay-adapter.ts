import type {
  OrderPayChannel,
  PayCreateResponse,
  PayTotalAmountResponse,
} from "@ryx/shared-types";

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

function readAmount(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value !== "string") return undefined;
  const normalized = value.replace(/[¥,\s]/g, "");
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : undefined;
}

function readAmountByAliases(data: Record<string, unknown>, aliases: string[]): number | undefined {
  for (const alias of aliases) {
    const exact = readAmount(data[alias]);
    if (exact != null) return exact;
  }

  const normalizedAliases = new Set(aliases.map((alias) => alias.toLowerCase()));
  for (const [key, value] of Object.entries(data)) {
    if (!normalizedAliases.has(key.toLowerCase())) continue;
    const amount = readAmount(value);
    if (amount != null) return amount;
  }
  return undefined;
}

export function normalizePayTotalAmount(raw: unknown): PayTotalAmountResponse {
  if (!raw || typeof raw !== "object") {
    return { TotalPayAmount: 0 };
  }
  const data = raw as Record<string, unknown>;
  const totalPayAmount = readAmountByAliases(data, [
    "TotalPayAmount",
    "PayAmount",
    "TotalAmount",
    "Amount",
    "PayMoney",
    "OrderAmount",
    "NeedPayAmount",
    "ActualAmount",
    "PaymentAmount",
  ]) ?? 0;
  const payHoldTime = readAmountByAliases(data, [
    "PayHoldTime",
    "OrderPayHoldTime",
    "HoldMinute",
  ]);
  return {
    ...(data as unknown as Partial<PayTotalAmountResponse>),
    TotalPayAmount: totalPayAmount,
    PayHoldTime: payHoldTime,
  };
}

export function buildLegacyPayCreatePayload(input: {
  orderId: string;
  payType: string;
  key?: string;
  createType?: "Mobile" | "JsSdk";
  dataType?: string;
  openId?: string;
  wechatAppId?: string;
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
    CreateType: input.createType ?? "Mobile",
    DataType: input.dataType ?? "json",
    ...(input.key ? { Key: input.key } : {}),
    ...(input.openId ? { OpenId: input.openId } : {}),
    ...(input.wechatAppId ? { WechatAppId: input.wechatAppId } : {}),
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
