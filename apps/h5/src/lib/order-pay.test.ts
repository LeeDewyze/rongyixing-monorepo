import { describe, expect, it, vi } from "vitest";

import {
  buildLegacyH5PayUrl,
  executeOrderPayFlow,
  formatPayHoldCountdown,
  requiresPersonalPayment,
  resolveCheckoutSuccessMessage,
  resolveLegacyH5PayType,
  resolvePayCreateOutTradeNo,
  resolvePayFailureMessage,
  resolvePayHoldSeconds,
  shouldUseLegacyH5PayRedirect,
  shouldUseWechatJsSdk,
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
    expect(formatPayHoldCountdown(167.99)).toBe("02:47");
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
    expect(
      resolvePayCreateOutTradeNo(
        { Number: "PERSONAL-NUMBER", OutTradeNo: "OUT-TRADE" },
        { channel: "tourist", payType: "Alipay" },
      ),
    ).toBe("PERSONAL-NUMBER");
    expect(
      resolvePayCreateOutTradeNo(
        { Number: "PERSONAL-NUMBER", OutTradeNo: "OUT-TRADE" },
        { channel: "tmc", payType: "Alipay" },
      ),
    ).toBe("OUT-TRADE");
  });
});

describe("resolvePayFailureMessage", () => {
  it("returns message when create status is false", () => {
    expect(resolvePayFailureMessage({ Status: false, Message: "余额不足" })).toBe("余额不足");
    expect(resolvePayFailureMessage({ Status: true })).toBeUndefined();
  });
});

describe("legacy H5 tourist pay", () => {
  it("redirects Alipay and WeChat for tourist train/flight/hotel H5 pay", () => {
    expect(resolveLegacyH5PayType("Alipay")).toBe("2");
    expect(resolveLegacyH5PayType("Wechatpay")).toBe("3");
    expect(resolveLegacyH5PayType("Icbcpay")).toBeUndefined();
    expect(
      shouldUseLegacyH5PayRedirect({
        channel: "tourist",
        productType: "Train",
        payType: "Alipay",
      }),
    ).toBe(true);
    expect(
      shouldUseLegacyH5PayRedirect({
        channel: "tourist",
        productType: "Flight",
        payType: "Wechatpay",
      }),
    ).toBe(true);
    expect(
      shouldUseLegacyH5PayRedirect({
        channel: "tourist",
        productType: "Hotel",
        payType: "Alipay",
      }),
    ).toBe(true);
    expect(
      shouldUseLegacyH5PayRedirect({
        channel: "tourist",
        productType: "Train",
        payType: "Icbcpay",
      }),
    ).toBe(false);
  });

  it("uses JS-SDK for WeChat channel inside the WeChat browser regardless of channel", () => {
    expect(
      shouldUseWechatJsSdk({ isWechatBrowser: true, payType: "Wechatpay" }),
    ).toBe(true);
    expect(shouldUseWechatJsSdk({ isWechatBrowser: true, payType: "3" })).toBe(true);
    expect(shouldUseWechatJsSdk({ isWechatBrowser: true, payType: "Alipay" })).toBe(false);
    expect(shouldUseWechatJsSdk({ isWechatBrowser: true, payType: "Icbcpay" })).toBe(false);
    expect(
      shouldUseWechatJsSdk({ isWechatBrowser: false, payType: "Wechatpay" }),
    ).toBe(false);
  });

  it("builds legacy /home/Pay url for tourist train H5 pay", () => {
    const url = new URL(
      buildLegacyH5PayUrl({
        appBaseUrl: "http://app.rtesp.com/",
        orderId: "44880000000033",
        payType: "Alipay",
        ticket: "ticket-1",
        ticketName: "ticket",
        domain: "rtesp.com",
        language: "cn",
        token: "token-1",
        tmcId: "10001",
        mmsId: "1",
        openid: "openid-1",
        wechatAppId: "wx-app-1",
        createType: "JsSdk",
        returnPath: "pay/result?orderId=44880000000033&productType=Flight",
      }),
    );
    expect(`${url.origin}${url.pathname}`).toBe("http://app.rtesp.com/home/Pay");
    expect(url.searchParams.get("ticket")).toBe("ticket-1");
    expect(url.searchParams.get("Method")).toBe("TmcTouristOrderUrl-Pay-Create");
    expect(url.searchParams.get("Version")).toBe("2.0");
    expect(url.searchParams.get("TmcId")).toBe("10001");
    expect(url.searchParams.get("MmsId")).toBe("1");
    expect(url.searchParams.get("openid")).toBe("openid-1");
    expect(url.searchParams.get("path")).toBe("pay/result?orderId=44880000000033&productType=Flight");
    expect(JSON.parse(url.searchParams.get("Data") ?? "{}")).toMatchObject({
      Channel: "App",
      Type: "2",
      OrderId: "44880000000033",
      IsApp: false,
      CreateType: "JsSdk",
      DataType: "json",
      OpenId: "openid-1",
      WechatAppId: "wx-app-1",
    });
    expect(url.searchParams.get("wechatAppId")).toBeNull();
  });

  it("keeps Mobile for non-WeChat H5", () => {
    const url = new URL(
      buildLegacyH5PayUrl({
        appBaseUrl: "http://app.rtesp.com",
        orderId: "ORD-1",
        payType: "Wechatpay",
        ticket: "ticket-1",
        ticketName: "ticket",
        domain: "rtesp.com",
        language: "cn",
        token: "token-1",
        tmcId: "10001",
        mmsId: "1",
      }),
    );
    expect(JSON.parse(url.searchParams.get("Data") ?? "{}")).toEqual({
      Channel: "App",
      Type: "3",
      OrderId: "ORD-1",
      IsApp: false,
      CreateType: "Mobile",
    });
  });
});

describe("executeOrderPayFlow", () => {
  it("processes pay when create returns out trade no (WeChat)", async () => {
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

  it("processes ICBC (Type 7) pay when create returns out trade no", async () => {
    const createPay = vi.fn().mockResolvedValue({ OutTradeNo: "PAY-ICBC" });
    const processPay = vi.fn().mockResolvedValue({ Success: true });
    const result = await executeOrderPayFlow({
      orderId: "ORD-2",
      payType: "7",
      createPay,
      processPay,
    });
    expect(result.processed).toBe(true);
    expect(createPay).toHaveBeenCalledWith({ OrderId: "ORD-2", PayType: "7" });
    expect(processPay).toHaveBeenCalledWith({ OutTradeNo: "PAY-ICBC", Type: "7" });
  });
});
