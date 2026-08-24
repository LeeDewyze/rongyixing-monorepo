import { afterEach, describe, expect, it, vi } from "vitest";

import { buildDingTalkRedirectUrl, readDingTalkCode, requestDingTalkCode } from "./dingtalk";

const TICKET = "current-ticket";
const TMC_ID = "10365";

function setupBrowser(
  search = "?root=www&domain=rongtrip.cn",
  options: { assign?: (url: string) => void; storedTmcId?: string | null } = {},
) {
  const { assign = vi.fn(), storedTmcId = TMC_ID } = options;
  const setItem = vi.fn();
  vi.stubGlobal("window", {
    location: { origin: "https://app.rongtrip.cn", search, assign },
  });
  vi.stubGlobal("location", { search });
  vi.stubGlobal("localStorage", {
    getItem: (key: string) =>
      key === "ticket"
        ? TICKET
        : key === "ryx_domain"
          ? "rongtrip.cn"
          : key === "ryx_tmcid"
            ? storedTmcId
            : null,
    setItem,
  });
  vi.stubGlobal("sessionStorage", {
    getItem: () => null,
    removeItem: vi.fn(),
  });
  return { assign, setItem };
}

describe("DingTalk redirect", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("uses the stored external tmcid (ryx_tmcid) instead of a URL parameter", () => {
    setupBrowser("?root=www&domain=rongtrip.cn&tmcid=10099");

    const url = new URL(buildDingTalkRedirectUrl("bind", "/settings/dingtalk"));

    expect(url.searchParams.get("tmcid")).toBe(TMC_ID);
    expect(url.searchParams.get("ticket")).toBe(TICKET);
    expect(url.searchParams.get("path")).toBe("account-dingtalk");
  });

  it("redirects to the legacy authorization endpoint with the stored tmcid", async () => {
    const { assign } = setupBrowser();

    await requestDingTalkCode("bind", "/settings/dingtalk");

    expect(assign).toHaveBeenCalledWith(expect.stringContaining(`tmcid=${TMC_ID}`));
  });

  it("falls back to a URL tmcid and persists it to storage", () => {
    const { setItem } = setupBrowser("?root=www&domain=rongtrip.cn&tmcid=10099", {
      storedTmcId: null,
    });

    const url = new URL(buildDingTalkRedirectUrl("bind", "/settings/dingtalk"));

    expect(url.searchParams.get("tmcid")).toBe("10099");
    expect(setItem).toHaveBeenCalledWith("ryx_tmcid", "10099");
  });

  it("requires a stored tmcid without requesting Identity/Get", () => {
    setupBrowser(undefined, { storedTmcId: null });

    expect(() => buildDingTalkRedirectUrl("bind", "/settings/dingtalk")).toThrow("TMCID");
  });

  it("reads DingTalkCode with any parameter casing", () => {
    expect(readDingTalkCode(new URLSearchParams("DingTalkCode=callback-code"))).toEqual({
      key: "DingTalkCode",
      value: "callback-code",
    });
  });
});
