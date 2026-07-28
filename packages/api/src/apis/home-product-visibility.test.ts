import { describe, expect, it } from "vitest";

import {
  getVisibleHomeProductsFromPersonalWorkbench,
  getVisibleHomeProductsFromSitemaps,
  getVisibleHomeProductsFromWorkbenches,
  hasTravelApplyWorkbench,
} from "./home-product-visibility.js";

const workbenches = [
  {
    Name: "因公出行",
    Value: [
      { Name: "机票", Url: { path: "tmc-flight-search" } },
      { Name: "火车票", Url: { path: "tmc-train-search" } },
      { Name: "酒店", Url: { path: "tmc-hotel-search" } },
    ],
  },
  {
    Name: "因私出行",
    Value: [
      { Name: "国内机票-因私", Url: { path: "public-flight-search" } },
      { Name: "酒店", Url: { path: "public-hotel-search" } },
    ],
  },
];

describe("getVisibleHomeProductsFromWorkbenches", () => {
  it("uses the business workbench routes for business mode", () => {
    expect(getVisibleHomeProductsFromWorkbenches(workbenches)).toEqual([
      "flight",
      "train",
      "hotel",
    ]);
  });

  it("recognizes JSON string URLs returned by legacy APIs", () => {
    expect(
      getVisibleHomeProductsFromWorkbenches([
        {
          Name: "因公出行",
          Value: [{ Name: "火车票", Url: JSON.stringify({ path: "tmc-train-search" }) }],
        },
      ]),
    ).toEqual(["train"]);
  });
});

describe("hasTravelApplyWorkbench", () => {
  it("detects the travel-apply group configured by the TMC", () => {
    expect(
      hasTravelApplyWorkbench([
        ...workbenches,
        {
          Name: "出差申请",
          Value: [{ Name: "我的审批", Url: { path: "path://tmc-approval-task", tag: "TmcFlow" } }],
        },
      ]),
    ).toBe(true);
  });

  it("hides the panel when the workbench omits the travel-apply group", () => {
    expect(hasTravelApplyWorkbench(workbenches)).toBe(false);
  });

  it("hides the panel when the travel-apply group has no entries", () => {
    expect(hasTravelApplyWorkbench([{ Name: "出差申请", Value: [] }])).toBe(false);
  });
});

describe("getVisibleHomeProductsFromPersonalWorkbench", () => {
  it("uses the personal workbench routes for personal mode", () => {
    expect(getVisibleHomeProductsFromPersonalWorkbench(workbenches)).toEqual(["flight", "hotel"]);
  });
});

describe("getVisibleHomeProductsFromSitemaps", () => {
  it("uses the tourist sitemap routes for personal mode", () => {
    expect(
      getVisibleHomeProductsFromSitemaps([
        { Title: "国内机票", Url: "path://public-flight-search", Tag: "Ball" },
        { Title: "国内酒店", Url: JSON.stringify({ path: "public-hotel-search" }), Tag: "Ball" },
      ]),
    ).toEqual(["flight", "hotel"]);
  });

  it("hides personal train when the sitemap response omits it", () => {
    expect(
      getVisibleHomeProductsFromSitemaps([
        { Title: "国内机票", Url: "path://public-flight-search" },
        { Title: "国内酒店", Url: "path://public-hotel-search" },
      ]),
    ).not.toContain("train");
  });

  it("ignores sitemap routes outside the legacy Ball navigation group", () => {
    expect(
      getVisibleHomeProductsFromSitemaps([
        { Title: "火车票", Url: "path://public-train-search", Tag: "Promotion" },
      ]),
    ).toEqual([]);
  });
});
