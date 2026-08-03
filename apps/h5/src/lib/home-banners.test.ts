import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  filterPersonalizedBanners,
  normalizeBannerImageUrl,
  resolveBannerSlides,
} from "@/lib/home-banners";

describe("filterPersonalizedBanners", () => {
  const store: Record<string, string> = {};

  beforeEach(() => {
    Object.keys(store).forEach((key) => delete store[key]);
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
    });
  });

  it("keeps all banners when personalized push is enabled", () => {
    localStorage.setItem("_key_is_stop_PersonOn_AccountMessageSetting", "true");

    const banners = [
      { Id: 1, Title: "个性推荐活动", ImageUrl: "https://example.com/a.png" },
      { Id: 2, Title: "普通通知", ImageUrl: "https://example.com/b.png" },
    ];

    expect(filterPersonalizedBanners(banners)).toEqual(banners);
  });

  it("filters promo-tagged banners when personalized push is disabled", () => {
    localStorage.setItem("_key_is_stop_PersonOn_AccountMessageSetting", "false");

    const banners = [
      { Id: 1, Title: "个性推荐活动", ImageUrl: "https://example.com/a.png" },
      { Id: 2, Title: "普通通知", ImageUrl: "https://example.com/b.png" },
    ];

    expect(filterPersonalizedBanners(banners)).toEqual([banners[1]]);
  });
});

describe("normalizeBannerImageUrl", () => {
  it("upgrades http urls to https on secure pages", () => {
    vi.stubGlobal("window", { location: { protocol: "https:" } });
    expect(normalizeBannerImageUrl("http://image48.rtesp.com/a.png")).toBe(
      "https://image48.rtesp.com/a.png",
    );
  });

  it("keeps http urls on local http dev", () => {
    vi.stubGlobal("window", { location: { protocol: "http:" } });
    expect(normalizeBannerImageUrl("http://image48.rtesp.com/a.png")).toBe(
      "http://image48.rtesp.com/a.png",
    );
  });
});

describe("resolveBannerSlides", () => {
  it("returns empty list when banners are empty", () => {
    expect(resolveBannerSlides([])).toEqual([]);
  });

  it("maps banners with ids and image urls", () => {
    const slides = resolveBannerSlides([{ Id: "b1", ImageUrl: " https://img.test/b.png " }]);
    expect(slides).toEqual([
      {
        id: "b1",
        imageUrl: "https://img.test/b.png",
        banner: { Id: "b1", ImageUrl: " https://img.test/b.png " },
      },
    ]);
  });
});
