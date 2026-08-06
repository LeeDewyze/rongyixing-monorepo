import { describe, expect, it } from "vitest";

import { isDingTalkUserAgent } from "./dingtalk.js";

describe("isDingTalkUserAgent", () => {
  it("recognizes DingTalk WebView user agents", () => {
    expect(isDingTalkUserAgent("Mozilla/5.0 DingTalk/7.6.10 Android")).toBe(true);
  });

  it("does not recognize ordinary browsers", () => {
    expect(isDingTalkUserAgent("Mozilla/5.0 Chrome/150.0.0.0 Mobile Safari/537.36")).toBe(false);
  });
});
