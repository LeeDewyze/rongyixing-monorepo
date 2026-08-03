import { beforeEach, describe, expect, it, vi } from "vitest";

import { coreJump } from "@/lib/core-jump";

describe("coreJump http branch", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      open: vi.fn(),
      alert: vi.fn(),
    });
  });

  it("opens a new window when isBlank is set", async () => {
    const navigate = vi.fn();
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    const ok = await coreJump(navigate, "https://example.com/promo", { isBlank: true });
    expect(ok).toBe(true);
    expect(openSpy).toHaveBeenCalledWith("https://example.com/promo", "_blank");
    expect(navigate).not.toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it("navigates to open-url for embedded http links", async () => {
    const navigate = vi.fn();
    const ok = await coreJump(navigate, "https://example.com/page", { title: "详情" });
    expect(ok).toBe(true);
    expect(navigate).toHaveBeenCalledWith(expect.stringContaining("/open-url?url="));
  });
});
