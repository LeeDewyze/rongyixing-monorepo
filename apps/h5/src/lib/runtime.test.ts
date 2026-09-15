import { afterEach, describe, expect, it } from "vitest";

import { isNativeCapacitorRuntime } from "@/lib/runtime";

const originalWindow = (globalThis as { window?: unknown }).window;

afterEach(() => {
  if (originalWindow === undefined) {
    delete (globalThis as { window?: unknown }).window;
  } else {
    (globalThis as { window?: unknown }).window = originalWindow;
  }
});

describe("isNativeCapacitorRuntime", () => {
  it("returns true inside a Capacitor native shell", () => {
    (globalThis as { window?: unknown }).window = {
      Capacitor: {
        isNativePlatform: () => true,
      },
    };

    expect(isNativeCapacitorRuntime()).toBe(true);
  });

  it("returns false in a normal browser", () => {
    (globalThis as { window?: unknown }).window = {};

    expect(isNativeCapacitorRuntime()).toBe(false);
  });

  it("returns false when window is unavailable", () => {
    delete (globalThis as { window?: unknown }).window;

    expect(isNativeCapacitorRuntime()).toBe(false);
  });
});
