import { describe, expect, it, vi } from "vitest";

import { buildTelUrl, dialPhone, type DialPhoneHost } from "./dial-phone";

function createHost(overrides: Partial<DialPhoneHost> = {}): DialPhoneHost & {
  copiedTexts: string[];
  notifiedPhones: string[];
} {
  const copiedTexts: string[] = [];
  const notifiedPhones: string[] = [];
  return {
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
    copiedTexts,
    notifiedPhones,
    copyText: vi.fn(async (text) => {
      copiedTexts.push(text);
      return true;
    }),
    notifyCopied: (phone) => {
      notifiedPhones.push(phone);
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
    expect(host.copiedTexts).toEqual([]);
  });

  it("copies the phone number and notifies the user", async () => {
    const host = createHost();
    expect(dialPhone("010-56739999", host)).toBe(true);
    await vi.waitFor(() => expect(host.notifiedPhones).toEqual(["010-56739999"]));
    expect(host.copiedTexts).toEqual(["010-56739999"]);
  });

  it("does not notify when copying fails", async () => {
    const host = createHost({ copyText: vi.fn(async () => false) });
    expect(dialPhone("010-56739999", host)).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(host.notifiedPhones).toEqual([]);
  });
});
