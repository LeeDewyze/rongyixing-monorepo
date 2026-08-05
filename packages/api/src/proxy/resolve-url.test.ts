import { describe, expect, it } from "vitest";

import { isGatewayProxyUrl, parseMethod, resolveUrl } from "./resolve-url.js";

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

  it("uses __ryx dev proxy path when baseUrl is empty", () => {
    expect(
      resolveUrl({
        baseUrl: "",
        method: "ApiMemberUrl-Passenger-Add",
        apiConfig: {
          Token: "t",
          Urls: { ApiMemberUrl: "http://member-api.rtesp.com" },
        },
      }),
    ).toBe("/__ryx/ApiMemberUrl/Passenger/Add");
  });

  it("keeps method query when routing through vite dev proxy", () => {
    expect(
      resolveUrl({
        baseUrl: "",
        method: "TmcApiOrderUrl-Order-GetLinkmans?name=杨",
        apiConfig: {
          Token: "t",
          Urls: { TmcApiOrderUrl: "http://order-api-tmc.rtesp.com" },
        },
      }),
    ).toBe("/__ryx/TmcApiOrderUrl/Order/GetLinkmans?name=%E6%9D%A8");
  });

  it("routes HrApiUrl methods through vite dev proxy", () => {
    expect(
      resolveUrl({
        baseUrl: "",
        method: "HrApiUrl-Staff-Get",
        apiConfig: {
          Token: "t",
          Urls: { HrApiUrl: "http://api-hr.rtesp.com" },
        },
      }),
    ).toBe("/__ryx/HrApiUrl/Staff/Get");
  });

  it("disambiguates hotel Home/List in vite dev", () => {
    expect(
      resolveUrl({
        baseUrl: "",
        method: "TmcApiHotelUrl-Home-List",
        apiConfig: {
          Token: "t",
          Urls: {
            TmcApiHotelUrl: "http://hotel-api-tmc.rtesp.com",
            TmcApiHomeUrl: "http://api-tmc.rtesp.com",
          },
        },
      }),
    ).toBe("/__ryx/TmcApiHotelUrl/Home/List");
  });

  it("routes tourist service methods to their direct service URLs", () => {
    const apiConfig = {
      Token: "t",
      Urls: {
        TmcTouristFlightUrl: "http://flight-api-tourist.rtesp.com",
        TmcTouristTrainUrl: "http://train-api-tourist.rtesp.com",
        TmcTouristHotelUrl: "http://hotel-api-tourist.rtesp.com",
        TmcTouristBookUrl: "http://book-api-tourist.rtesp.com",
        TmcTouristOrderUrl: "http://order-api-tourist.rtesp.com",
      },
    };

    expect(
      resolveUrl({
        baseUrl: "",
        method: "TmcTouristFlightUrl-Home-Index",
        apiConfig,
      }),
    ).toBe("/__ryx/TmcTouristFlightUrl/Home/Index");
    expect(
      resolveUrl({
        baseUrl: "",
        method: "TmcTouristTrainUrl-Home-Search",
        apiConfig,
      }),
    ).toBe("/__ryx/TmcTouristTrainUrl/Home/Search");
    expect(
      resolveUrl({
        baseUrl: "",
        method: "TmcTouristHotelUrl-Home-List",
        apiConfig,
      }),
    ).toBe("/__ryx/TmcTouristHotelUrl/Home/List");
    expect(
      resolveUrl({
        baseUrl: "",
        method: "TmcTouristBookUrl-Flight-Initialize",
        apiConfig,
      }),
    ).toBe("/__ryx/TmcTouristBookUrl/Flight/Initialize");
    expect(
      resolveUrl({
        baseUrl: "",
        method: "TmcTouristOrderUrl-Order-Detail",
        apiConfig,
      }),
    ).toBe("/__ryx/TmcTouristOrderUrl/Order/Detail");
  });

  it("routes Home-Tourist through legacy gateway proxy", () => {
    expect(
      resolveUrl({
        baseUrl: "",
        method: "TmcApiHomeUrl-Home-Tourist",
        apiConfig: {
          Token: "t",
          Urls: { TmcApiHomeUrl: "http://api-tmc.rtesp.com" },
        },
      }),
    ).toBe("/Home/Proxy");
  });

  it("routes workflow approval lists through vite dev proxy", () => {
    expect(
      resolveUrl({
        baseUrl: "",
        method: "WorkflowApiUrl-History-List",
        apiConfig: {
          Token: "t",
          Urls: { WorkflowApiUrl: "http://api-workflow.rtesp.com" },
        },
      }),
    ).toBe("/__ryx/WorkflowApiUrl/History/List");
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

  it("keeps tourist methods on direct service URLs in direct mode", () => {
    expect(
      resolveUrl({
        baseUrl: "https://app.rongtrip.cn",
        method: "TmcTouristBookUrl-Hotel-Book",
        mode: "direct",
        apiConfig: {
          Token: "t",
          Urls: { TmcTouristBookUrl: "https://tourist-book.example.com" },
        },
      }),
    ).toBe("https://tourist-book.example.com/Hotel/Book");
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

describe("isGatewayProxyUrl", () => {
  it("detects /Home/Proxy gateway", () => {
    expect(isGatewayProxyUrl("https://app.rongtrip.cn/Home/Proxy")).toBe(true);
    expect(isGatewayProxyUrl("/Home/Proxy?domain=rtesp.com")).toBe(true);
  });

  it("returns false for direct microservice paths", () => {
    expect(isGatewayProxyUrl("/__ryx/TmcApiFlightUrl/Home/Index")).toBe(false);
    expect(isGatewayProxyUrl("http://flight-api-tmc.rtesp.com/Home/Index")).toBe(false);
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

  it("splits tourist UrlKey-Controller-Action", () => {
    expect(parseMethod("TmcTouristOrderUrl-Pay-GetTotalPayAmount")).toEqual({
      urlKey: "TmcTouristOrderUrl",
      controller: "Pay",
      action: "GetTotalPayAmount",
    });
  });
});
