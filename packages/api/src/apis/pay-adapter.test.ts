import { describe, expect, it } from "vitest";

import {
  buildLegacyPayCreatePayload,
  buildLegacyPayProcessPayload,
  normalizeOrderPayChannels,
  normalizePayCreateResponse,
  resolveLegacyPayType,
  resolvePayRedirectUrl,
} from "./pay-adapter.js";

describe("normalizeOrderPayChannels", () => {
  it("maps legacy object response", () => {
    expect(normalizeOrderPayChannels({ "3": "微信支付", "2": "支付宝" })).toEqual(
      expect.arrayContaining([
        { PayType: "3", PayTypeName: "微信支付" },
        { PayType: "2", PayTypeName: "支付宝" },
      ]),
    );
  });

  it("maps object response with ICBC channel", () => {
    expect(
      normalizeOrderPayChannels({ Wechatpay: "微信支付", Alipay: "支付宝", Icbcpay: "工行支付" }),
    ).toEqual(
      expect.arrayContaining([
        { PayType: "Wechatpay", PayTypeName: "微信支付" },
        { PayType: "Alipay", PayTypeName: "支付宝" },
        { PayType: "Icbcpay", PayTypeName: "工行支付" },
      ]),
    );
  });

  it("keeps array response", () => {
    expect(
      normalizeOrderPayChannels([{ PayType: "Wechat", PayTypeName: "微信支付" }]),
    ).toEqual([{ PayType: "Wechat", PayTypeName: "微信支付", Icon: undefined }]);
  });
});

describe("resolveLegacyPayType", () => {
  it("maps common aliases", () => {
    expect(resolveLegacyPayType("wechat")).toBe("3");
    expect(resolveLegacyPayType("ali")).toBe("2");
    expect(resolveLegacyPayType("6")).toBe("6");
  });

  it("maps legacy pay channel keys returned by GetOrderPays", () => {
    expect(resolveLegacyPayType("Alipay")).toBe("2");
    expect(resolveLegacyPayType("Wechatpay")).toBe("3");
    expect(resolveLegacyPayType("Icbcpay")).toBe("7");
  });
});

describe("buildLegacyPayCreatePayload", () => {
  it("uses mobile H5 create params for WeChat", () => {
    expect(buildLegacyPayCreatePayload({ orderId: "ORD-1", payType: "wechat" })).toEqual({
      Channel: "App",
      Type: "3",
      OrderId: "ORD-1",
      IsApp: false,
      CreateType: "Mobile",
      DataType: "json",
    });
  });

  it("uses legacy ICBC create params without H5 mobile fields", () => {
    expect(buildLegacyPayCreatePayload({ orderId: "ORD-2", payType: "Icbcpay" })).toEqual({
      Channel: "App",
      Type: 7,
      OrderId: "ORD-2",
      IsApp: false,
    });
  });
});

describe("normalizePayCreateResponse", () => {
  it("extracts out trade no and redirect url", () => {
    expect(
      normalizePayCreateResponse({
        Number: "PAY-001",
        Url: "https://pay.example.com/h5",
        ExtraPayload: "keep-me",
      }),
    ).toMatchObject({
      PayOrderId: "PAY-001",
      OutTradeNo: "PAY-001",
      Number: "PAY-001",
      PayUrl: "https://pay.example.com/h5",
      Url: "https://pay.example.com/h5",
      ExtraPayload: "keep-me",
    });
  });
});

describe("buildLegacyPayProcessPayload", () => {
  it("builds process payload", () => {
    expect(
      buildLegacyPayProcessPayload({ outTradeNo: "PAY-001", payType: "ali" }),
    ).toEqual({
      OutTradeNo: "PAY-001",
      Type: "2",
    });
  });
});

describe("resolvePayRedirectUrl", () => {
  it("returns absolute url only", () => {
    expect(resolvePayRedirectUrl({ PayUrl: "https://pay.test/a" })).toBe("https://pay.test/a");
    expect(resolvePayRedirectUrl({ PayUrl: "/relative" })).toBeUndefined();
  });
});
