import { describe, expect, it } from "vitest";

import { parseMethod, resolveUrl } from "./resolve-url.js";

describe("resolveUrl", () => {
  it("falls back to /Home/Proxy in proxy mode", () => {
    expect(
      resolveUrl({
        baseUrl: "https://app.rongtrip.cn",
        method: "TmcApiHotelUrl-Home-Detail",
        mode: "proxy",
      }),
    ).toBe("https://app.rongtrip.cn/Home/Proxy");
  });

  it("resolves direct URL from api config", () => {
    expect(
      resolveUrl({
        baseUrl: "https://app.rongtrip.cn",
        method: "TmcApiHotelUrl-Home-Detail",
        mode: "direct",
        apiConfig: {
          Token: "t",
          Urls: { TmcApiHotelUrl: "https://hotel-api.example.com" },
        },
      }),
    ).toBe("https://hotel-api.example.com/Home/Detail");
  });

  it("uses explicit url when provided", () => {
    expect(
      resolveUrl({
        baseUrl: "https://app.rongtrip.cn",
        method: "Any-Method-Here",
        explicitUrl: "https://custom.example/post",
      }),
    ).toBe("https://custom.example/post");
  });
});

describe("parseMethod", () => {
  it("splits UrlKey-Controller-Action", () => {
    expect(parseMethod("TmcApiHotelUrl-Home-Detail")).toEqual({
      urlKey: "TmcApiHotelUrl",
      controller: "Home",
      action: "Detail",
    });
  });
});
