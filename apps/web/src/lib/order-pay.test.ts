import { describe, expect, it } from "vitest";

import { shouldUseLegacyH5PayRedirect } from "@/lib/order-pay";

describe("shouldUseLegacyH5PayRedirect", () => {
  it("redirects Alipay and WeChat for tourist train/flight/hotel pay", () => {
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
        channel: "tmc",
        productType: "Hotel",
        payType: "Alipay",
      }),
    ).toBe(false);
    expect(
      shouldUseLegacyH5PayRedirect({
        channel: "tourist",
        productType: "Hotel",
        payType: "Icbcpay",
      }),
    ).toBe(false);
  });
});
