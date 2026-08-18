import { afterEach, describe, expect, it, vi } from "vitest";

import { buildDingTalkRedirectUrl, requestDingTalkCode } from "./dingtalk";

describe("DingTalk redirect", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("uses the tenant domain and preserves legacy business parameters", () => {
    vi.stubGlobal("window", {
      location: {
        origin: "https://app.rongtrip.cn",
        search: "?root=www&domain=rongtrip.cn&ticket=stale",
      },
    });
    vi.stubGlobal("location", { search: "?root=www&domain=rongtrip.cn&ticket=stale" });
    vi.stubGlobal("localStorage", {
      getItem: (key: string) =>
        ({ ryx_domain: "rongtrip.cn", ticket: "current-ticket", ticketName: null })[key] ?? null,
    });

    const url = new URL(buildDingTalkRedirectUrl("bind", "/settings/dingtalk"));

    expect(url.pathname).toBe("/home/GetDingTalkCode");
    expect(url.searchParams.get("domain")).toBe("rongtrip.cn");
    expect(url.searchParams.get("ticket")).toBe("stale");
    expect(url.searchParams.get("path")).toBe("account-dingtalk");
    expect(url.searchParams.get("root")).toBe("www");
    expect(url.searchParams.get("ticket")).not.toBe("current-ticket");
  });

  it("always uses the legacy authorization redirect", async () => {
    const assign = vi.fn();
    vi.stubGlobal("window", {
      location: { origin: "https://app.rongtrip.cn", search: "?root=www", assign },
    });
    vi.stubGlobal("localStorage", { getItem: () => "rongtrip.cn" });

    await requestDingTalkCode("bind", "/settings/dingtalk");

    expect(assign).toHaveBeenCalledWith(expect.stringContaining("/home/GetDingTalkCode"));
  });
});
