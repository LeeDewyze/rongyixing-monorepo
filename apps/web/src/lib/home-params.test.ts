import { describe, expect, it } from "vitest";

import { buildHomeProductSearch, parseHomeProduct } from "./home-params";

describe("home-params", () => {
  it("defaults home product to flight", () => {
    expect(parseHomeProduct(new URLSearchParams())).toBe("flight");
  });

  it("keeps explicit home product", () => {
    expect(parseHomeProduct(new URLSearchParams("product=hotel"))).toBe("hotel");
    expect(buildHomeProductSearch("flight").toString()).toBe("product=flight");
  });
});
