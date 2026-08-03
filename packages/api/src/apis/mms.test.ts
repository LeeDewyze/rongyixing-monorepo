import { describe, expect, it, vi } from "vitest";

import { MMS_METHODS } from "../methods/mms.js";
import { createMmsApi } from "./mms.js";

describe("createMmsApi", () => {
  it("loads tourist sitemaps with the configured MmsId", async () => {
    const send = vi
      .fn()
      .mockResolvedValue([{ Title: "国内机票", Url: "path://public-flight-search", Tag: "Ball" }]);
    const api = createMmsApi({ send } as never);

    const result = await api.getSitemaps({ mmsId: "10002" });

    expect(send).toHaveBeenCalledWith({
      method: MMS_METHODS.SITEMAP_LIST,
      data: {},
      requestFields: {
        MmsId: "10002",
        IsRedirctLogin: false,
      },
    });
    expect(result).toHaveLength(1);
  });
});
