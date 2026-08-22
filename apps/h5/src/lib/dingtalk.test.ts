import { afterEach, describe, expect, it, vi } from "vitest";

import { buildDingTalkRedirectUrl, readDingTalkCode, requestDingTalkCode } from "./dingtalk";

describe("DingTalk redirect", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("uses the tenant domain and preserves legacy business parameters", () => {
    vi.stubGlobal("window", {
      location: {
        origin: "https://app.rongtrip.cn",
        search: "?root=www&domain=rongtrip.cn&tmcid=10099&ticket=stale",
      },
    });
    vi.stubGlobal("location", { search: "?root=www&domain=rongtrip.cn&tmcid=10099&ticket=stale" });
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
      location: { origin: "https://app.rongtrip.cn", search: "?root=www&tmcid=10099", assign },
    });
    vi.stubGlobal("location", { search: "?root=www&tmcid=10099" });
    vi.stubGlobal("localStorage", { getItem: () => "rongtrip.cn" });

    await requestDingTalkCode("bind", "/settings/dingtalk");

    expect(assign).toHaveBeenCalledWith(expect.stringContaining("/home/GetDingTalkCode"));
  });

  it("does not add returnTo to the legacy binding callback", () => {
    vi.stubEnv("BASE_URL", "/www/");
    vi.stubEnv("VITE_API_ROOT", "www");
    vi.stubGlobal("window", {
      location: {
        origin: "https://app.rongtrip.cn",
        search: "?domain=rongtrip.cn&tmcid=10099&ticket=current-ticket",
      },
    });
    vi.stubGlobal("location", { search: "?domain=rongtrip.cn&tmcid=10099&ticket=current-ticket" });
    vi.stubGlobal("localStorage", { getItem: () => null });

    const url = new URL(buildDingTalkRedirectUrl("bind", "/settings/dingtalk"));

    expect(url.searchParams.get("returnTo")).toBeNull();
    expect(url.searchParams.get("root")).toBe("www");
  });

  it("keeps returnTo for the separate DingTalk login entry", () => {
    vi.stubEnv("BASE_URL", "/www/");
    vi.stubGlobal("window", {
      location: { origin: "https://app.rongtrip.cn", search: "?tmcid=10099" },
    });
    vi.stubGlobal("location", { search: "?tmcid=10099" });
    vi.stubGlobal("localStorage", { getItem: () => null });

    const url = new URL(buildDingTalkRedirectUrl("login", "/home"));

    expect(url.searchParams.get("returnTo")).toBe("/www/home");
  });

  it("does not resolve a missing tmcid through Identity/Get", () => {
    vi.stubGlobal("window", {
      location: { origin: "https://app.rongtrip.cn", search: "?root=www" },
    });
    vi.stubGlobal("location", { search: "?root=www" });
    vi.stubGlobal("localStorage", { getItem: () => null });
    vi.stubGlobal("sessionStorage", { getItem: () => null });

    expect(() => buildDingTalkRedirectUrl("bind", "/settings/dingtalk")).toThrow("TMCID");
  });

  it("preserves the tmcid supplied by the legacy entry URL", () => {
    vi.stubGlobal("window", {
      location: {
        origin: "https://app.rongtrip.cn",
        search: "?root=www&tmcid=10099&ticket=current-ticket",
      },
    });
    vi.stubGlobal("location", {
      search: "?root=www&tmcid=10099&ticket=current-ticket",
    });
    vi.stubGlobal("localStorage", { getItem: () => null });

    const url = new URL(buildDingTalkRedirectUrl("bind", "/settings/dingtalk"));

    expect(url.searchParams.get("tmcid")).toBe("10099");
  });

  it("reads DingTalkCode with any parameter casing", () => {
    expect(readDingTalkCode(new URLSearchParams("DingTalkCode=callback-code"))).toEqual({
      key: "DingTalkCode",
      value: "callback-code",
    });
  });

  it("requires tmcid before building an authorization URL", () => {
    vi.stubGlobal("window", {
      location: { origin: "https://app.rongtrip.cn", search: "?root=www&ticket=current-ticket" },
    });
    vi.stubGlobal("location", { search: "?root=www&ticket=current-ticket" });
    vi.stubGlobal("localStorage", { getItem: () => null });
    vi.stubGlobal("sessionStorage", { getItem: () => null });

    expect(() => buildDingTalkRedirectUrl("bind", "/settings/dingtalk")).toThrow("TMCID");
  });
});
