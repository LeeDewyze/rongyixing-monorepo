import { describe, expect, it } from "vitest";

import { addDays, padFlightListDateStripRange, todayDateString } from "./date-search";

describe("padFlightListDateStripRange", () => {
  it("extends today strip forward without changing the start date", () => {
    const today = todayDateString();
    const range = padFlightListDateStripRange(today, 21);

    expect(range).toHaveLength(21);
    expect(range[0]).toBe(today);
    expect(range.at(-1)).toBe(addDays(today, 20));
  });

  it("keeps legacy range when it already meets the minimum", () => {
    const today = todayDateString();
    const selected = addDays(today, 10);
    const range = padFlightListDateStripRange(selected, 7);

    expect(range.length).toBeGreaterThan(7);
    expect(range[0]).toBe(addDays(selected, -7));
  });
});
