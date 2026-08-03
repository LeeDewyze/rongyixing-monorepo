import { ApiError } from "@ryx/api";
import { describe, expect, it } from "vitest";

import { formatApiError } from "./formatApiError";

describe("formatApiError", () => {
  it("maps list fetch failures by product context", () => {
    const error = new ApiError("没有获取列表", 500);

    expect(formatApiError(error, "train")).toContain("车次列表获取失败");
    expect(formatApiError(error, "flight")).toContain("航班列表获取失败");
    expect(formatApiError(error, "hotel")).toContain("酒店列表获取失败");
  });

  it("maps login expiry by product context", () => {
    const error = new ApiError("登陆超时", 401, "nologin");

    expect(formatApiError(error, "train")).toContain("查询车次");
    expect(formatApiError(error, "flight")).toContain("查询航班");
  });
});
