import { describe, expect, it } from "vitest";

import {
  getLoopRealIndex,
  resolveLoopTrackIndex,
  resolveSwipeIndex,
} from "@/components/home/HomeBannerCarousel";

describe("resolveLoopTrackIndex", () => {
  it("moves to next track position on left swipe", () => {
    expect(resolveLoopTrackIndex(2, 4, -80)).toBe(3);
  });

  it("moves to previous track position on right swipe", () => {
    expect(resolveLoopTrackIndex(2, 4, 80)).toBe(1);
  });

  it("keeps track index when swipe is below threshold", () => {
    expect(resolveLoopTrackIndex(2, 4, -10)).toBe(2);
  });
});

describe("getLoopRealIndex", () => {
  it("maps head clone to last real slide", () => {
    expect(getLoopRealIndex(0, 4)).toBe(3);
  });

  it("maps tail clone to first real slide", () => {
    expect(getLoopRealIndex(5, 4)).toBe(0);
  });

  it("maps middle track positions to real slides", () => {
    expect(getLoopRealIndex(2, 4)).toBe(1);
  });
});

describe("resolveSwipeIndex", () => {
  it("moves to next slide on left swipe", () => {
    expect(resolveSwipeIndex(0, 3, -80)).toBe(1);
  });

  it("moves to previous slide on right swipe", () => {
    expect(resolveSwipeIndex(0, 3, 80)).toBe(2);
  });

  it("keeps index when swipe is below threshold", () => {
    expect(resolveSwipeIndex(1, 3, -10)).toBe(1);
  });
});
