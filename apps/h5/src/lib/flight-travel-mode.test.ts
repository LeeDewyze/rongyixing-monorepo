import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  loadHomeTravelMode,
  resolveFlightTravelType,
  resolveOrderTravelType,
  resolveProductChannel,
  saveHomeTravelMode,
  shouldEnableTravelForm,
} from "./flight-travel-mode";

describe("flight-travel-mode", () => {
  const store: Record<string, string> = {};

  beforeEach(() => {
    Object.keys(store).forEach((key) => delete store[key]);
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
    });
  });

  it("defaults to business mode without session", () => {
    expect(loadHomeTravelMode()).toBe("business");
    expect(resolveOrderTravelType()).toBe(1);
    expect(resolveProductChannel()).toBe("tmc");
  });

  it("resolves personal mode to tourist channel", () => {
    saveHomeTravelMode("personal");

    expect(loadHomeTravelMode()).toBe("personal");
    expect(resolveOrderTravelType()).toBe(2);
    expect(resolveFlightTravelType()).toBe(2);
    expect(resolveProductChannel()).toBe("tourist");
  });

  it("resolves business mode to TMC channel", () => {
    saveHomeTravelMode("business");

    expect(loadHomeTravelMode()).toBe("business");
    expect(resolveOrderTravelType()).toBe(1);
    expect(resolveFlightTravelType()).toBe(1);
    expect(resolveProductChannel()).toBe("tmc");
  });

  it("does not use Staff BookType to determine product channel", () => {
    const staff = { BookType: 1 };
    saveHomeTravelMode("personal");

    expect(staff.BookType).toBe(1);
    expect(resolveProductChannel()).toBe("tourist");
    expect(shouldEnableTravelForm(undefined, true)).toBe(false);
  });

  it("enables TravelNumber forms only for business mode with TMC switch enabled", () => {
    expect(shouldEnableTravelForm("business", true)).toBe(true);
    expect(shouldEnableTravelForm("business", false)).toBe(false);
    expect(shouldEnableTravelForm("personal", true)).toBe(false);
  });
});
