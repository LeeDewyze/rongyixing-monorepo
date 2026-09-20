import { describe, expect, it, vi } from "vitest";

import {
  bootstrapWechatOAuthCallback,
  buildWechatOAuthUrl,
  isWechatH5,
} from "./wechat-oauth";

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

  it("restores a hash payment route after the OAuth callback", () => {
    const storage = new Map<string, string>([
      ["ryx_wechat_pending_pay_url", "#/orders/train/ORD-1/pay?channel=tourist"],
    ]);
    const replaceState = vi.fn();
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    });
    vi.stubGlobal("localStorage", {
      setItem: vi.fn(),
      getItem: vi.fn(() => null),
    });
    vi.stubGlobal("document", { cookie: "" });
    vi.stubGlobal("window", {
      location: {
        href: "https://app.rongtrip.cn/www/#/home?wechatopenid=openid-1",
        pathname: "/www/",
        search: "",
        hash: "#/home?wechatopenid=openid-1",
      },
      history: {
        state: null,
        replaceState,
      },
    });

    expect(bootstrapWechatOAuthCallback()).toBe(true);
    expect(replaceState).toHaveBeenCalledWith(
      null,
      "",
      "#/orders/train/ORD-1/pay?channel=tourist",
    );
    expect(storage.has("ryx_wechat_pending_pay_url")).toBe(false);

    vi.unstubAllGlobals();
  });
});
