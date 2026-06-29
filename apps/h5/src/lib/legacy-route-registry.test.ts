import { describe, expect, it } from "vitest";

import {
  getNormalizedLegacyPath,
  normalizeLegacyRoutePath,
  resolveLegacyRoute,
} from "@/lib/legacy-route-registry";

describe("normalizeLegacyRoutePath", () => {
  it("appends skin suffix for base paths", () => {
    expect(normalizeLegacyRoutePath("account-setting", "ryx")).toBe("account-setting_ryx");
  });

  it("strips existing suffix before re-appending skin", () => {
    expect(normalizeLegacyRoutePath("tmc-flight-search_ryx", "ryx")).toBe("tmc-flight-search_ryx");
  });
});

describe("resolveLegacyRoute", () => {
  it("maps flight search aliases to home flight tab", () => {
    expect(resolveLegacyRoute("tmc-flight-search")).toEqual({
      pathname: "/home",
      search: "?product=flight",
    });
    expect(resolveLegacyRoute("tmc-flight-search_ryx")).toEqual({
      pathname: "/home",
      search: "?product=flight",
    });
  });

  it("maps hotel search path to home hotel tab", () => {
    expect(resolveLegacyRoute("tmc-hotel-search")).toEqual({
      pathname: "/home",
      search: "?product=hotel",
    });
  });

  it("normalizes leading slash paths", () => {
    expect(getNormalizedLegacyPath("/tmc-order-list_ryx")).toBe("tmc-order-list_ryx");
    expect(resolveLegacyRoute("tmc-order-list_ryx")?.pathname).toBe("/orders");
  });
});
