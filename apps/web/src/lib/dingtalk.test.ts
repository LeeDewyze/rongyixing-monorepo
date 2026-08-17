import { afterEach, describe, expect, it, vi } from "vitest";

import { buildDingTalkRedirectUrl, requestDingTalkCode } from "./dingtalk";

describe("DingTalk redirect", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("uses the tenant domain and preserves legacy business parameters", () => {
    vi.stubGlobal("window", {
      location: { origin: "https://app.rongtrip.cn", search: "?root=www&ticket=stale" },
    });
    vi.stubGlobal("localStorage", {
      getItem: (key: string) =>
        ({ ryx_domain: "rongtrip.cn", ticket: "current-ticket" })[key] ?? null,
    });

    const url = new URL(buildDingTalkRedirectUrl("bind", "/settings/dingtalk"));

    expect(url.pathname).toBe("/home/GetDingTalkCode");
    expect(url.searchParams.get("domain")).toBe("rongtrip.cn");
    expect(url.searchParams.get("ticket")).toBe("current-ticket");
    expect(url.searchParams.get("path")).toBe("account-dingtalk");
    expect(url.searchParams.get("root")).toBe("www");
    expect(url.searchParams.get("ticket")).not.toBe("stale");
  });

  it("falls back to the legacy redirect when SDK authorization fails", async () => {
    const assign = vi.fn();
    const requestAuthCode = vi.fn((_options, callback) => callback({ errCode: "USER_CANCEL" }));
    vi.stubEnv("VITE_DINGTALK_CORP_ID", "corp-id");
    vi.stubGlobal("dd", { runtime: { permission: { requestAuthCode } } });
    vi.stubGlobal("window", {
      location: { origin: "https://app.rongtrip.cn", search: "?root=www", assign },
      setTimeout,
      clearTimeout,
    });
    vi.stubGlobal("localStorage", { getItem: () => "rongtrip.cn" });

    await requestDingTalkCode("bind", "/settings/dingtalk");

    expect(requestAuthCode).toHaveBeenCalledWith({ corpId: "corp-id" }, expect.any(Function));
    expect(assign).toHaveBeenCalledWith(expect.stringContaining("/home/GetDingTalkCode"));
  });
});
