import { describe, expect, it } from "vitest";

import {
  getLoopRealIndex,
  getCenteredTrackOffsetPx,
  resolveLoopTrackIndex,
} from "@/components/home/WebBannerCarousel";

describe("WebBannerCarousel loop helpers", () => {
  it("maps loop track index to real slide index", () => {
    expect(getLoopRealIndex(0, 3)).toBe(2);
    expect(getLoopRealIndex(1, 3)).toBe(0);
    expect(getLoopRealIndex(4, 3)).toBe(0);
  });

  it("resolves swipe direction into next track index", () => {
    expect(resolveLoopTrackIndex(1, 3, -50)).toBe(2);
    expect(resolveLoopTrackIndex(1, 3, 50)).toBe(0);
    expect(resolveLoopTrackIndex(1, 3, -10)).toBe(1);
  });

  it("centers the active slide in the track", () => {
    expect(getCenteredTrackOffsetPx(0)).toBe(220);
    expect(getCenteredTrackOffsetPx(1)).toBe(676);
  });
});
