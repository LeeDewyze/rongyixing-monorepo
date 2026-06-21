import { describe, expect, it } from "vitest";

import { parseMethod, resolveUrl } from "./resolve-url.js";

describe("resolveUrl", () => {
  it("falls back to /Home/Proxy when api config is missing", () => {
    expect(
      resolveUrl({
        baseUrl: "https://app.rongtrip.cn",
        method: "TmcApiHotelUrl-Home-Detail",
        mode: "proxy",
      }),
    ).toBe("https://app.rongtrip.cn/Home/Proxy");
  });

  it("resolves direct service URL when api config is loaded (Legacy)", () => {
    expect(
      resolveUrl({
        baseUrl: "https://app.rongtrip.cn",
        method: "ApiMemberUrl-Passenger-Add",
        mode: "proxy",
        apiConfig: {
          Token: "t",
          Urls: { ApiMemberUrl: "http://member-api.rtesp.com" },
        },
      }),
    ).toBe("http://member-api.rtesp.com/Passenger/Add");
  });

  it("uses same-origin path for vite dev when baseUrl is empty", () => {
    expect(
      resolveUrl({
        baseUrl: "",
        method: "ApiMemberUrl-Passenger-Add",
        apiConfig: {
          Token: "t",
          Urls: { ApiMemberUrl: "http://member-api.rtesp.com" },
        },
      }),
    ).toBe("/Passenger/Add");
  });

  it("resolves direct URL from api config in direct mode", () => {
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

  it("uses LoginUrl from api config for auth login methods", () => {
    expect(
      resolveUrl({
        baseUrl: "https://app.rongtrip.cn",
        method: "ApiLoginUrl-Home-Login",
        mode: "proxy",
        apiConfig: {
          Token: "t",
          Urls: {},
          LoginUrl: "https://ronglv-feature.rongtrip.cn/Jyx/LoginByRyx",
        },
      }),
    ).toBe("https://ronglv-feature.rongtrip.cn/Jyx/LoginByRyx");
  });

  it("uses /Home/Proxy for Identity GetWebSocketUrl (Legacy unsigned)", () => {
    expect(
      resolveUrl({
        baseUrl: "",
        method: "ApiHomeUrl-Identity-GetWebSocketUrl",
        apiConfig: {
          Token: "t",
          Urls: { ApiHomeUrl: "http://api.rtesp.com" },
        },
      }),
    ).toBe("/Home/Proxy");
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
