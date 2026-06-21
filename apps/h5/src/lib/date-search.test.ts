import { describe, expect, it } from "vitest";

import { buildDateRange, parseLocalDate, relativeDayLabel } from "./date-search";

describe("date-search", () => {
  it("parseLocalDate rejects invalid strings", () => {
    expect(parseLocalDate("")).toBeNull();
    expect(parseLocalDate("undefined")).toBeNull();
    expect(parseLocalDate("2026-13-01")).toBeNull();
    expect(parseLocalDate("2026-06-15")).not.toBeNull();
  });

  it("buildDateRange never throws on invalid start date", () => {
    expect(() => buildDateRange("", 3)).not.toThrow();
    expect(() => buildDateRange("bad", 3)).not.toThrow();
    expect(buildDateRange("bad", 3)).toHaveLength(3);
  });

  it("relativeDayLabel handles invalid date", () => {
    expect(relativeDayLabel("invalid")).toBe("");
  });
});
