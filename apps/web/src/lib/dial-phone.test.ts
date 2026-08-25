import { describe, expect, it, vi } from "vitest";

import { buildTelUrl, dialPhone, type DialPhoneHost } from "./dial-phone";

function createHost(overrides: Partial<DialPhoneHost> = {}): DialPhoneHost & {
  clickedUrls: string[];
} {
  const clickedUrls: string[] = [];
  return {
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
    clickedUrls,
    clickTelAnchor: (url) => {
      clickedUrls.push(url);
    },
    ...overrides,
  };
}

describe("buildTelUrl", () => {
  it("prefixes tel: and ignores empty values", () => {
    expect(buildTelUrl("010-56739999")).toBe("tel:010-56739999");
    expect(buildTelUrl(" tel:010-56739999 ")).toBe("tel:010-56739999");
    expect(buildTelUrl("")).toBe("");
    expect(buildTelUrl("   ")).toBe("");
  });
});

describe("dialPhone", () => {
  it("returns false for an empty number", () => {
    const host = createHost();
    expect(dialPhone("", host)).toBe(false);
    expect(host.clickedUrls).toEqual([]);
  });

  it("uses the native call plugin when present", () => {
    const callNumber = vi.fn().mockResolvedValue(undefined);
    const host = createHost({ nativeCall: { callNumber } });
    expect(dialPhone("010-56739999", host)).toBe(true);
    expect(callNumber).toHaveBeenCalledWith("010-56739999", true);
    expect(host.clickedUrls).toEqual([]);
  });

  it("clicks a programmatic tel: anchor on Android when no native bridge exists", () => {
    const host = createHost({
      userAgent: "Mozilla/5.0 (Linux; Android 12; Pixel) AppleWebKit/537.36",
    });
    expect(dialPhone("010-56739999", host)).toBe(true);
    expect(host.clickedUrls).toEqual(["tel:010-56739999"]);
  });
});
