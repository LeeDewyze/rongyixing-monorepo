import { describe, expect, it } from "vitest";

import { normalizeBannerList } from "./home-banner-adapter.js";

describe("normalizeBannerList", () => {
  it("keeps PascalCase banner rows", () => {
    expect(
      normalizeBannerList([
        {
          Id: "1",
          Title: "Hotel",
          ImageUrl: "https://cdn.test/a.png",
          Url: { path: "tmc-hotel-search" },
        },
      ]),
    ).toEqual([
      {
        Id: "1",
        Title: "Hotel",
        ImageUrl: "https://cdn.test/a.png",
        Url: { path: "tmc-hotel-search" },
      },
    ]);
  });

  it("accepts camelCase keys and JSON string payloads", () => {
    const json = JSON.stringify([
      {
        id: "2",
        title: "Flight",
        imageUrl: "https://cdn.test/b.png",
        url: { path: "tmc-flight-search" },
      },
    ]);
    expect(normalizeBannerList(json)).toEqual([
      {
        Id: "2",
        Title: "Flight",
        ImageUrl: "https://cdn.test/b.png",
        Url: { path: "tmc-flight-search" },
      },
    ]);
  });

  it("drops rows without an image url", () => {
    expect(normalizeBannerList([{ Id: "x", Title: "No image" }])).toEqual([]);
  });
});
