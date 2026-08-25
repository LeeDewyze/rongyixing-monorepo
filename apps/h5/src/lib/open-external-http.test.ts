import { describe, expect, it } from "vitest";

import {
  buildEmbeddedOpenUrl,
  openExternalHttp,
  shouldEmbedExternalHttp,
  type OpenExternalHttpHost,
} from "./open-external-http";

const AMAP_URL =
  "https://uri.amap.com/marker?position=116.357754,39.915498&name=%E5%8C%97%E4%BA%AC%E5%A4%A9%E6%B3%B0%E5%AE%BE%E9%A6%86";
const GENERIC_URL = "https://example.com/path";

function createHost(overrides: Partial<OpenExternalHttpHost> = {}): OpenExternalHttpHost & {
  navigatedTo: string[];
  newTabUrls: string[];
} {
  const navigatedTo: string[] = [];
  const newTabUrls: string[] = [];
  return {
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    title: "地图",
    navigate: (to) => {
      navigatedTo.push(to);
    },
    openInNewTab: (url) => {
      newTabUrls.push(url);
    },
    navigatedTo,
    newTabUrls,
    ...overrides,
  };
}

describe("shouldEmbedExternalHttp", () => {
  it("embeds on Android and iOS so the current WebView document is not replaced", () => {
    expect(shouldEmbedExternalHttp("Mozilla/5.0 (Linux; Android 12; Pixel)")).toBe(true);
    expect(shouldEmbedExternalHttp("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")).toBe(
      true,
    );
    expect(shouldEmbedExternalHttp("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")).toBe(false);
  });
});

describe("buildEmbeddedOpenUrl", () => {
  it("keeps the map on the same-origin /open-url route", () => {
    const path = buildEmbeddedOpenUrl(AMAP_URL, "地图");
    expect(path.startsWith("/open-url?")).toBe(true);
    const params = new URLSearchParams(path.slice(path.indexOf("?") + 1));
    expect(params.get("url")).toBe(AMAP_URL);
    expect(params.get("title")).toBe("地图");
  });
});

describe("openExternalHttp", () => {
  it("returns false for an empty url", () => {
    const host = createHost();
    expect(openExternalHttp("", host)).toBe(false);
    expect(host.navigatedTo).toEqual([]);
    expect(host.newTabUrls).toEqual([]);
  });

  it("keeps amap in the same-origin iframe route on Android", () => {
    const host = createHost({
      userAgent: "Mozilla/5.0 (Linux; Android 12; Pixel) AppleWebKit/537.36",
    });
    expect(openExternalHttp(AMAP_URL, host)).toBe(true);
    expect(host.navigatedTo).toEqual([buildEmbeddedOpenUrl(AMAP_URL, "地图")]);
    expect(host.newTabUrls).toEqual([]);
  });

  it("still embeds ordinary external pages on Android", () => {
    const host = createHost({
      userAgent: "Mozilla/5.0 (Linux; Android 12; Pixel) AppleWebKit/537.36",
    });
    expect(openExternalHttp(GENERIC_URL, host)).toBe(true);
    expect(host.navigatedTo).toEqual([buildEmbeddedOpenUrl(GENERIC_URL, "地图")]);
    expect(host.newTabUrls).toEqual([]);
  });

  it("opens a new tab on desktop", () => {
    const host = createHost();
    expect(openExternalHttp(AMAP_URL, host)).toBe(true);
    expect(host.newTabUrls).toEqual([AMAP_URL]);
    expect(host.navigatedTo).toEqual([]);
  });
});
