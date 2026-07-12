import { describe, expect, it } from "vitest";

import {
  getLoopRealIndex,
  getCenteredTrackOffsetPx,
  resolveBannerSlideSize,
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

  it("scales banner slides with container width within bounds", () => {
    expect(resolveBannerSlideSize(400)).toEqual({ width: 440, height: 220 });
    expect(resolveBannerSlideSize(900)).toEqual({ width: 450, height: 225 });
    expect(resolveBannerSlideSize(1312)).toEqual({ width: 560, height: 280 });
    expect(resolveBannerSlideSize(2000)).toEqual({ width: 560, height: 280 });
  });
});
