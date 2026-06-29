import { describe, expect, it } from "vitest";

import { TMC_METHODS } from "@ryx/api";

import { MOCK_HOME_BANNERS } from "../fixtures/home-banners.js";
import { createTmcMockHandlers } from "./tmc.js";

describe("tmc mock BANNER_LIST", () => {
  it("returns home banner fixture", () => {
    const handlers = createTmcMockHandlers();
    const response = handlers[TMC_METHODS.BANNER_LIST]({});
    expect(response.Status).toBe(true);
    expect(response.Data).toEqual(MOCK_HOME_BANNERS);
    expect(
      MOCK_HOME_BANNERS.some(
        (banner) => banner.Url && typeof banner.Url === "object" && banner.Url.checkUrl,
      ),
    ).toBe(true);
  });
});
