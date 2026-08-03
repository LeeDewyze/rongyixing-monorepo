import { describe, expect, it } from "vitest";

import {
  buildOrderListSearchParams,
  getOrderCategoryLabel,
  parseOrderListChannel,
  parseOrderListCategoryId,
  parseOrderListRouteState,
  parseOrderListScope,
  resolveOrderTypeTab,
} from "./order-list-params";

describe("parseOrderListCategoryId", () => {
  it("prefers tab param over tabId", () => {
    const params = new URLSearchParams("tab=flight&tabId=3");
    expect(parseOrderListCategoryId(params)).toBe("flight");
  });

  it("maps legacy tabId to category", () => {
    expect(parseOrderListCategoryId(new URLSearchParams("tabId=3"))).toBe("hotel");
    expect(parseOrderListCategoryId(new URLSearchParams("tabId=1"))).toBe("flight");
  });

  it("defaults to flight", () => {
    expect(parseOrderListCategoryId(new URLSearchParams())).toBe("flight");
  });
});

describe("parseOrderListScope", () => {
  it("maps pendingTravel scope", () => {
    expect(parseOrderListScope("pendingTravel")).toBe("pendingTravel");
    expect(parseOrderListScope("all")).toBe("all");
    expect(parseOrderListScope(null)).toBe("all");
  });
});

describe("parseOrderListChannel", () => {
  it("reads explicit channel", () => {
    expect(parseOrderListChannel(new URLSearchParams("channel=tourist"))).toBe("tourist");
    expect(parseOrderListChannel(new URLSearchParams("channel=tmc"))).toBe("tmc");
  });

  it("falls back to home travel mode for legacy links", () => {
    expect(parseOrderListChannel(new URLSearchParams("tab=flight"), "personal")).toBe("tourist");
    expect(parseOrderListChannel(new URLSearchParams("tab=flight"), "business")).toBe("tmc");
  });

  it("uses tmc as explicit default for invalid channel without mode", () => {
    expect(parseOrderListChannel(new URLSearchParams("channel=bad"))).toBe("tmc");
  });
});

describe("parseOrderListRouteState", () => {
  it("parses channel, category and scope", () => {
    expect(
      parseOrderListRouteState(
        new URLSearchParams("channel=tourist&tab=train&scope=pendingTravel"),
      ),
    ).toEqual({
      channel: "tourist",
      categoryId: "train",
      scope: "pendingTravel",
    });
  });
});

describe("buildOrderListSearchParams", () => {
  it("writes explicit channel, tab and scope while dropping tabId", () => {
    const params = buildOrderListSearchParams(new URLSearchParams("tabId=3"), {
      channel: "tourist",
      categoryId: "train",
      scope: "pendingTravel",
    });

    expect(params.toString()).toBe("channel=tourist&tab=train&scope=pendingTravel");
  });
});

describe("resolveOrderTypeTab", () => {
  it("resolves a combined channel/category tab", () => {
    expect(resolveOrderTypeTab("tourist", "train").label).toBe("因私火车");
  });
});

describe("getOrderCategoryLabel", () => {
  it("returns label for known category", () => {
    expect(getOrderCategoryLabel("hotel")).toBe("酒店");
  });
});
