import { describe, expect, it } from "vitest";

import {
  FLIGHT_CALENDAR_CONFIG,
  TRAIN_CALENDAR_CONFIG,
  calendarMaxSelectableDate,
  calendarMinSelectableDate,
  createEmptyDateRangeDraft,
  reduceCalendarSelection,
} from "./calendar-picker";
import { addDays, todayDateString } from "./date-search";

describe("calendarMinSelectableDate", () => {
  it("allows yesterday for hotel before 06:00", () => {
    const yesterday = addDays(todayDateString(), -1);
    expect(
      calendarMinSelectableDate(
        { ...FLIGHT_CALENDAR_CONFIG, product: "hotel", selection: "range" },
        new Date(2026, 5, 22, 2, 0, 0),
      ),
    ).toBe(yesterday);
  });

  it("uses today for flight regardless of hour", () => {
    const today = todayDateString();
    expect(calendarMinSelectableDate(FLIGHT_CALENDAR_CONFIG, new Date(2026, 5, 22, 2, 0, 0))).toBe(
      today,
    );
  });
});

describe("calendarMaxSelectableDate", () => {
  it("limits train to 14 days ahead", () => {
    expect(calendarMaxSelectableDate(TRAIN_CALENDAR_CONFIG)).toBe(addDays(todayDateString(), 14));
  });

  it("has no max for flight", () => {
    expect(calendarMaxSelectableDate(FLIGHT_CALENDAR_CONFIG)).toBeUndefined();
  });
});

describe("reduceCalendarSelection single mode", () => {
  const min = todayDateString();

  it("completes on first tap for flight", () => {
    const result = reduceCalendarSelection(
      FLIGHT_CALENDAR_CONFIG,
      createEmptyDateRangeDraft(),
      min,
      min,
    );
    expect(result).toEqual({
      type: "complete",
      draft: { start: min, end: min },
      hint: "",
    });
  });

  it("rejects dates beyond train window", () => {
    const beyond = addDays(todayDateString(), 15);
    const max = calendarMaxSelectableDate(TRAIN_CALENDAR_CONFIG)!;
    const result = reduceCalendarSelection(
      TRAIN_CALENDAR_CONFIG,
      createEmptyDateRangeDraft(),
      beyond,
      min,
      max,
    );
    expect(result).toEqual({ type: "noop" });
  });
});
