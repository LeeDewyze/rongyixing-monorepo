import { describe, expect, it } from "vitest";

import { formatFlightTime } from "./flight-list";

describe("formatFlightTime", () => {
  it("extracts HH:mm from ISO datetime", () => {
    expect(formatFlightTime("2026-06-23T20:50:00")).toBe("20:50");
    expect(formatFlightTime("2026-01-05T22:05:00")).toBe("22:05");
  });

  it("extracts HH:mm from space-separated datetime", () => {
    expect(formatFlightTime("2026-06-23 20:50:00")).toBe("20:50");
  });

  it("returns time-only strings unchanged", () => {
    expect(formatFlightTime("22:20")).toBe("22:20");
  });

  it("returns placeholder for empty value", () => {
    expect(formatFlightTime(undefined)).toBe("--:--");
  });
});
