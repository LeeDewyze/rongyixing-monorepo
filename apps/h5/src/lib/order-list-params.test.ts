import { describe, expect, it } from "vitest";

import {
  getOrderCategoryLabel,
  parseOrderListCategoryId,
  parseOrderListScope,
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

describe("getOrderCategoryLabel", () => {
  it("returns label for known category", () => {
    expect(getOrderCategoryLabel("hotel")).toBe("酒店");
  });
});
