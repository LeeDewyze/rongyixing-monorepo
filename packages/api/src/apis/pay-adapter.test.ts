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
      normalizeOrderPayChannels({ "3": "微信支付", "2": "支付宝", "6": "工行快捷支付" }),
    ).toEqual(
      expect.arrayContaining([
        { PayType: "3", PayTypeName: "微信支付" },
        { PayType: "2", PayTypeName: "支付宝" },
        { PayType: "6", PayTypeName: "工行快捷支付" },
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

  it("maps ICBC quickexpress alias", () => {
    expect(resolveLegacyPayType("quickexpress")).toBe("6");
    expect(resolveLegacyPayType("QuickExpress")).toBe("6");
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

  it("uses mobile H5 create params for ICBC (Type 6)", () => {
    expect(buildLegacyPayCreatePayload({ orderId: "ORD-2", payType: "6" })).toEqual({
      Channel: "App",
      Type: "6",
      OrderId: "ORD-2",
      IsApp: false,
      CreateType: "Mobile",
      DataType: "json",
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
