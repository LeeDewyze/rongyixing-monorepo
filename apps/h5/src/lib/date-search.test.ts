import { describe, expect, it } from "vitest";

import {
  addDays,
  buildDateRange,
  buildListDateStripRange,
  parseLocalDate,
  relativeDayLabel,
  todayDateString,
} from "./date-search";

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

  it("buildListDateStripRange spans 7 days before and 13 days after selected", () => {
    const range = buildListDateStripRange("2026-12-15", 7, 13);
    expect(range[0]).toBe("2026-12-08");
    expect(range.at(-1)).toBe("2026-12-28");
    expect(range).toHaveLength(21);
  });

  it("buildListDateStripRange does not start before today", () => {
    const today = todayDateString();
    const selected = addDays(today, 3);
    const range = buildListDateStripRange(selected, 7, 13);
    expect(range[0]).toBe(today);
    expect(range.at(-1)).toBe(addDays(selected, 13));
  });

  it("relativeDayLabel handles invalid date", () => {
    expect(relativeDayLabel("invalid")).toBe("");
  });
});
