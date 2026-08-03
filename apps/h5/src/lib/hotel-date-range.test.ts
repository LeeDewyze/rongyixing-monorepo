import { describe, expect, it } from "vitest";

import {
  buildInitialMonths,
  createHotelDateRangeDraft,
  createEmptyHotelDateRangeDraft,
  getDayCellState,
  getDayEndpointLabel,
  hotelCanSelectYesterday,
  hotelMinSelectableDate,
  prependPreviousMonths,
  reduceHotelDateRangeSelection,
} from "./hotel-date-range";
import { addDays, todayDateString } from "./date-search";

describe("hotelCanSelectYesterday", () => {
  it("returns true between 00:00 and 05:59 local", () => {
    expect(hotelCanSelectYesterday(new Date(2026, 5, 22, 3, 0, 0))).toBe(true);
    expect(hotelCanSelectYesterday(new Date(2026, 5, 22, 5, 59, 0))).toBe(true);
  });

  it("returns false from 06:00 onward", () => {
    expect(hotelCanSelectYesterday(new Date(2026, 5, 22, 6, 0, 0))).toBe(false);
    expect(hotelCanSelectYesterday(new Date(2026, 5, 22, 12, 0, 0))).toBe(false);
  });
});

describe("hotelMinSelectableDate", () => {
  it("allows yesterday before 06:00", () => {
    const today = todayDateString();
    const yesterday = addDays(today, -1);
    expect(hotelMinSelectableDate(new Date(2026, 5, 22, 2, 0, 0))).toBe(yesterday);
  });

  it("uses today from 06:00 onward", () => {
    const today = todayDateString();
    expect(hotelMinSelectableDate(new Date(2026, 5, 22, 8, 0, 0))).toBe(today);
  });
});

describe("reduceHotelDateRangeSelection", () => {
  const min = "2026-06-20";

  it("selects first date as check-in", () => {
    const result = reduceHotelDateRangeSelection(
      createEmptyHotelDateRangeDraft(),
      "2026-06-25",
      min,
    );
    expect(result).toEqual({
      type: "partial",
      draft: { checkIn: "2026-06-25", checkOut: null },
      hint: "请选择离店日期",
    });
  });

  it("completes range when second tap is later", () => {
    const result = reduceHotelDateRangeSelection(
      { checkIn: "2026-06-25", checkOut: null },
      "2026-06-27",
      min,
    );
    expect(result).toEqual({
      type: "complete",
      draft: { checkIn: "2026-06-25", checkOut: "2026-06-27" },
      hint: "共2晚",
    });
  });

  it("resets anchor when second tap is earlier (not swap)", () => {
    const result = reduceHotelDateRangeSelection(
      { checkIn: "2026-06-25", checkOut: null },
      "2026-06-22",
      min,
    );
    expect(result).toEqual({
      type: "partial",
      draft: { checkIn: "2026-06-22", checkOut: null },
      hint: "请选择离店日期",
    });
  });

  it("ignores re-tap on selected check-in", () => {
    const result = reduceHotelDateRangeSelection(
      { checkIn: "2026-06-25", checkOut: null },
      "2026-06-25",
      min,
    );
    expect(result).toEqual({ type: "noop" });
  });

  it("ignores taps when range is complete", () => {
    const draft = createHotelDateRangeDraft("2026-06-25", "2026-06-27");
    expect(reduceHotelDateRangeSelection(draft, "2026-06-28", min)).toEqual({
      type: "noop",
    });
  });

  it("ignores disabled dates", () => {
    const result = reduceHotelDateRangeSelection(
      createEmptyHotelDateRangeDraft(),
      "2026-06-10",
      min,
    );
    expect(result).toEqual({ type: "noop" });
  });
});

describe("buildInitialMonths", () => {
  it("starts from the given date month", () => {
    const months = buildInitialMonths("2026-06-15", 3);
    expect(months.map((m) => m.label)).toEqual(["2026年06月", "2026年07月", "2026年08月"]);
  });
});

describe("prependPreviousMonths", () => {
  it("prepends months before the first loaded month", () => {
    const current = buildInitialMonths("2026-07-01", 2);
    const result = prependPreviousMonths(current, 2, "2026-06-01");
    expect(result[0]?.label).toBe("2026年06月");
    expect(result.map((m) => m.label)).toEqual(["2026年06月", "2026年07月", "2026年08月"]);
  });

  it("does not prepend before minDate month", () => {
    const current = buildInitialMonths("2026-06-01", 2);
    const result = prependPreviousMonths(current, 3, "2026-06-01");
    expect(result).toEqual(current);
  });
});

describe("getDayCellState", () => {
  const min = "2026-06-20";
  const today = todayDateString();

  it("marks same-day restored range", () => {
    expect(
      getDayCellState("2026-06-25", createHotelDateRangeDraft("2026-06-25", "2026-06-25"), min),
    ).toBe("sameDayEndpoint");
    expect(
      getDayEndpointLabel("2026-06-25", createHotelDateRangeDraft("2026-06-25", "2026-06-25")),
    ).toBe("入住离店");
  });

  it("marks range endpoints and in-between days", () => {
    const draft = createHotelDateRangeDraft("2026-06-25", "2026-06-27");
    expect(getDayCellState("2026-06-25", draft, min)).toBe("rangeStart");
    expect(getDayCellState("2026-06-26", draft, min)).toBe("inRange");
    expect(getDayCellState("2026-06-27", draft, min)).toBe("rangeEnd");
    expect(getDayEndpointLabel("2026-06-25", draft)).toBe("入住");
    expect(getDayEndpointLabel("2026-06-27", draft)).toBe("离店");
  });

  it("marks today when unselected", () => {
    if (today >= min) {
      expect(getDayCellState(today, createEmptyHotelDateRangeDraft(), min, today)).toBe("today");
    }
  });
});
