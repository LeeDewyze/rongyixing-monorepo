import { describe, expect, it, vi, beforeEach } from "vitest";

import { coreJump, onHomeBannerJump } from "@/lib/core-jump";

describe("coreJump path branch", () => {
  it("navigates to mapped home product route", async () => {
    const navigate = vi.fn();
    const ok = await coreJump(navigate, "path://tmc-train-search");
    expect(ok).toBe(true);
    expect(navigate).toHaveBeenCalledWith({
      pathname: "/home",
      search: "?product=train",
    });
  });
});

describe("coreJump http branch", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      open: vi.fn(),
      alert: vi.fn(),
    });
  });

  it("opens new window when isOpenInAppBrowser is set", async () => {
    const navigate = vi.fn();
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    const ok = await coreJump(navigate, "https://example.com/promo", {
      isOpenInAppBrowser: true,
    });
    expect(ok).toBe(true);
    expect(openSpy).toHaveBeenCalledWith("https://example.com/promo", "_self");
    openSpy.mockRestore();
  });

  it("navigates to open-url for embedded http links", async () => {
    const navigate = vi.fn();
    const ok = await coreJump(navigate, "https://example.com/page");
    expect(ok).toBe(true);
    expect(navigate).toHaveBeenCalledWith(expect.stringContaining("/open-url?url="));
  });
});

describe("onHomeBannerJump", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("uses json url for object Url payloads", async () => {
    const navigate = vi.fn();
    const ok = await onHomeBannerJump(navigate, {
      Name: "酒店",
      Url: { path: "tmc-hotel-search", tag: "TmcHotel" },
    });
    expect(ok).toBe(true);
    expect(navigate).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/home",
        search: expect.stringContaining("product=hotel"),
      }),
    );
  });
});

describe("coreJump checkUrl", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      open: vi.fn(),
      alert: vi.fn(),
    });
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: () => undefined,
    });
  });

  it("aborts jump when checkUrl fails", async () => {
    const navigate = vi.fn();
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => undefined);
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      json: async () => ({ Status: false, Message: "denied" }),
    } as Response);

    const ok = await coreJump(
      navigate,
      `json://${JSON.stringify({
        path: "tmc-hotel-search",
        checkUrl: "https://check.example.com/verify",
      })}`,
    );

    expect(ok).toBe(false);
    expect(alertSpy).toHaveBeenCalledWith("denied");
    expect(navigate).not.toHaveBeenCalled();
  });

  it("continues jump when checkUrl succeeds and merges Data", async () => {
    const navigate = vi.fn();
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      json: async () => ({ Status: true, Data: { promoId: "p1" } }),
    } as Response);

    const ok = await coreJump(
      navigate,
      `json://${JSON.stringify({
        path: "tmc-flight-search",
        checkUrl: "https://check.example.com/verify",
      })}`,
    );

    expect(ok).toBe(true);
    expect(navigate).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/home",
        search: expect.stringContaining("product=flight"),
      }),
    );
  });
});
