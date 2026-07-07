import type {
  CalendarDayCell,
  CalendarDayCellState,
  CalendarMonth,
  CalendarSelectionResult,
  DateRangeDraft,
} from "./calendar-picker";
import {
  HOTEL_CALENDAR_CONFIG,
  buildInitialMonths,
  buildMonthWeeks,
  calendarMinSelectableDate,
  createDateRangeDraft,
  createEmptyDateRangeDraft,
  formatMonthLabel,
  getCalendarDayCellState,
  getCalendarDayEndpointLabel,
  hotelCanSelectYesterday,
  monthSectionId,
  prependPreviousMonths,
  appendNextMonths,
  reduceCalendarSelection,
} from "./calendar-picker";

export type HotelDateRangeDraft = {
  checkIn: string | null;
  checkOut: string | null;
};

export type HotelDateRangeSelectionResult =
  | { type: "noop" }
  | { type: "partial"; draft: HotelDateRangeDraft; hint: string }
  | { type: "complete"; draft: HotelDateRangeDraft; hint: string };

export type HotelDayCellState = CalendarDayCellState;

export type { CalendarDayCell, CalendarMonth };

const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"] as const;
export { WEEKDAY_LABELS };

export { hotelCanSelectYesterday };

export function hotelMinSelectableDate(now = new Date()): string {
  return calendarMinSelectableDate(HOTEL_CALENDAR_CONFIG, now);
}

function toHotelDraft(draft: DateRangeDraft): HotelDateRangeDraft {
  return { checkIn: draft.start, checkOut: draft.end };
}

function fromHotelDraft(draft: HotelDateRangeDraft): DateRangeDraft {
  return { start: draft.checkIn, end: draft.checkOut };
}

function mapSelectionResult(result: CalendarSelectionResult): HotelDateRangeSelectionResult {
  if (result.type === "noop") return result;
  return {
    type: result.type,
    draft: toHotelDraft(result.draft),
    hint: result.hint,
  };
}

export function createHotelDateRangeDraft(checkIn: string, checkOut: string): HotelDateRangeDraft {
  return toHotelDraft(createDateRangeDraft(checkIn, checkOut));
}

export function createEmptyHotelDateRangeDraft(): HotelDateRangeDraft {
  return toHotelDraft(createEmptyDateRangeDraft());
}

export function reduceHotelDateRangeSelection(
  draft: HotelDateRangeDraft,
  tappedDate: string,
  minDate: string,
): HotelDateRangeSelectionResult {
  return mapSelectionResult(
    reduceCalendarSelection(HOTEL_CALENDAR_CONFIG, fromHotelDraft(draft), tappedDate, minDate),
  );
}

export function getDayCellState(
  dateStr: string,
  draft: HotelDateRangeDraft,
  minDate: string,
  today?: string,
): HotelDayCellState {
  return getCalendarDayCellState(dateStr, fromHotelDraft(draft), minDate, undefined, today);
}

export function getDayEndpointLabel(dateStr: string, draft: HotelDateRangeDraft): string | null {
  return getCalendarDayEndpointLabel(HOTEL_CALENDAR_CONFIG, dateStr, fromHotelDraft(draft));
}

export {
  formatMonthLabel,
  buildMonthWeeks,
  buildInitialMonths,
  prependPreviousMonths,
  appendNextMonths,
  monthSectionId,
};

export function isWeekendColumn(columnIndex: number): boolean {
  return columnIndex === 0 || columnIndex === 6;
}
