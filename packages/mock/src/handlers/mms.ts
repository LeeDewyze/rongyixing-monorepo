import { MMS_METHODS, successResponse } from "@ryx/api";
import type { IResponse } from "@ryx/shared-types";

export function createMmsMockHandlers(): Record<string, (data: unknown) => IResponse<unknown>> {
  return {
    [MMS_METHODS.SITEMAP_LIST]: () =>
      successResponse([
        { Title: "国内机票", Url: "path://public-flight-search", Tag: "Ball" },
        { Title: "火车票", Url: "path://public-train-search", Tag: "Ball" },
        { Title: "国内酒店", Url: "path://public-hotel-search", Tag: "Ball" },
      ]),
  };
}
