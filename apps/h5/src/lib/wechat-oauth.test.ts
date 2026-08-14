import { describe, expect, it } from "vitest";

import { buildWechatOAuthUrl, isWechatH5 } from "./wechat-oauth";

describe("wechat OAuth", () => {
  it("builds the legacy GetWechatCode URL without losing payment context", () => {
    const url = new URL(
      buildWechatOAuthUrl({
        appBaseUrl: "https://app.rongtrip.cn/",
        domain: "rongtrip.cn",
        ticket: "ticket-1",
        ticketName: "ticket",
        currentUrl: new URL(
          "https://app.rongtrip.cn/www/flight/pay/ORD-1?channel=tourist&root=www&wechatopenid=",
        ),
      }),
    );

    expect(`${url.origin}${url.pathname}`).toBe("https://app.rongtrip.cn/home/GetWechatCode");
    expect(url.searchParams.get("domain")).toBe("rongtrip.cn");
    expect(url.searchParams.get("ticket")).toBe("ticket-1");
    expect(url.searchParams.get("path")).toBe("www/flight/pay/ORD-1");
    expect(url.searchParams.get("channel")).toBe("tourist");
    expect(url.searchParams.has("wechatopenid")).toBe(false);
  });

  it("recognizes WeChat H5 but excludes mini programs", () => {
    expect(isWechatH5("Mozilla/5.0 MicroMessenger/8.0")).toBe(true);
    expect(isWechatH5("Mozilla/5.0 Chrome/151.0")).toBe(false);
  });
});
