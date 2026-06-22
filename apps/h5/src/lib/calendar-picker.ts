import { addDays, formatLocalDateString, parseLocalDate, todayDateString } from "./date-search";

export type CalendarProduct = "hotel" | "flight" | "train";

export type CalendarSelectionMode = "range" | "single";

export type CalendarPickerConfig = {
  product: CalendarProduct;
  selection: CalendarSelectionMode;
  title: string;
  startLabel: string;
  endLabel: string;
  sameDayLabel: string;
  partialHint: string;
  rangeCompleteHint: (nights: number) => string;
};

export const HOTEL_CALENDAR_CONFIG: CalendarPickerConfig = {
  product: "hotel",
  selection: "range",
  title: "请选择入离店日期",
  startLabel: "入住",
  endLabel: "离店",
  sameDayLabel: "入住离店",
  partialHint: "请选择离店日期",
  rangeCompleteHint: (nights) => `共${nights}晚`,
};

export const FLIGHT_CALENDAR_CONFIG: CalendarPickerConfig = {
  product: "flight",
  selection: "single",
  title: "请选择日期",
  startLabel: "去程",
  endLabel: "返程",
  sameDayLabel: "去程",
  partialHint: "请选择返程日期",
  rangeCompleteHint: (days) => `共${days}天`,
};

export const TRAIN_CALENDAR_CONFIG: CalendarPickerConfig = {
  product: "train",
  selection: "single",
  title: "请选择日期",
  startLabel: "去程",
  endLabel: "返程",
  sameDayLabel: "去程",
  partialHint: "请选择返程日期",
  rangeCompleteHint: (days) => `共${days}天`,
};

export type DateRangeDraft = {
  start: string | null;
  end: string | null;
};

export type CalendarSelectionResult =
  | { type: "noop" }
  | { type: "partial"; draft: DateRangeDraft; hint: string }
  | { type: "complete"; draft: DateRangeDraft; hint: string };

export type CalendarDayCellState =
  | "disabled"
  | "default"
  | "today"
  | "rangeStart"
  | "rangeEnd"
  | "sameDayEndpoint"
  | "inRange";

export type CalendarMonth = {
  year: number;
  month: number;
  label: string;
  weeks: CalendarDayCell[][];
};

export type CalendarDayCell = {
  date: string | null;
  isCurrentMonth: boolean;
};

export const CALENDAR_WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"] as const;

/** Whether yesterday is selectable for hotel (local time, 00:00–05:59). */
export function hotelCanSelectYesterday(now = new Date()): boolean {
  const hours = now.getHours();
  return hours >= 0 && hours <= 5;
}

export function calendarMinSelectableDate(config: CalendarPickerConfig, now = new Date()): string {
  if (config.product === "hotel" && hotelCanSelectYesterday(now)) {
    return addDays(todayDateString(), -1);
  }
  return todayDateString();
}

/** Legacy train calendar allows booking within ~14 days. */
export function calendarMaxSelectableDate(config: CalendarPickerConfig): string | undefined {
  if (config.product === "train") {
    return addDays(todayDateString(), 14);
  }
  return undefined;
}

function dateTimestamp(dateStr: string): number {
  return parseLocalDate(dateStr)?.getTime() ?? NaN;
}

function isDateEnabled(dateStr: string, minDate: string, maxDate?: string): boolean {
  const ts = dateTimestamp(dateStr);
  const minTs = dateTimestamp(minDate);
  if (Number.isNaN(ts) || Number.isNaN(minTs) || ts < minTs) return false;
  if (!maxDate) return true;
  const maxTs = dateTimestamp(maxDate);
  return !Number.isNaN(maxTs) && ts <= maxTs;
}

function isDateInDraft(dateStr: string, draft: DateRangeDraft): boolean {
  return draft.start === dateStr || draft.end === dateStr;
}

export function createDateRangeDraft(start: string, end: string): DateRangeDraft {
  return { start, end };
}

export function createEmptyDateRangeDraft(): DateRangeDraft {
  return { start: null, end: null };
}

export function reduceCalendarSelection(
  config: CalendarPickerConfig,
  draft: DateRangeDraft,
  tappedDate: string,
  minDate: string,
  maxDate?: string,
): CalendarSelectionResult {
  if (!isDateEnabled(tappedDate, minDate, maxDate)) {
    return { type: "noop" };
  }

  if (config.selection === "single") {
    if (draft.start && draft.end) return { type: "noop" };
    return {
      type: "complete",
      draft: { start: tappedDate, end: tappedDate },
      hint: "",
    };
  }

  const { start, end } = draft;

  if (start && end) {
    return { type: "noop" };
  }

  if (start && isDateInDraft(tappedDate, { start, end: null })) {
    return { type: "noop" };
  }

  if (!start) {
    return {
      type: "partial",
      draft: { start: tappedDate, end: null },
      hint: config.partialHint,
    };
  }

  const startTs = dateTimestamp(start);
  const tappedTs = dateTimestamp(tappedDate);

  if (tappedTs < startTs) {
    return {
      type: "partial",
      draft: { start: tappedDate, end: null },
      hint: config.partialHint,
    };
  }

  const nights = Math.round((tappedTs - startTs) / 86400000);
  return {
    type: "complete",
    draft: { start, end: tappedDate },
    hint: config.rangeCompleteHint(nights),
  };
}

export function getCalendarDayCellState(
  dateStr: string,
  draft: DateRangeDraft,
  minDate: string,
  maxDate?: string,
  today = todayDateString(),
): CalendarDayCellState {
  if (!isDateEnabled(dateStr, minDate, maxDate)) {
    return "disabled";
  }

  const { start, end } = draft;
  const ts = dateTimestamp(dateStr);

  if (start && end && start === end && dateStr === start) {
    return "sameDayEndpoint";
  }

  if (start && dateStr === start) {
    return "rangeStart";
  }

  if (end && dateStr === end) {
    return start === end ? "sameDayEndpoint" : "rangeEnd";
  }

  if (start && end && start !== end) {
    const startTs = dateTimestamp(start);
    const endTs = dateTimestamp(end);
    if (ts > startTs && ts < endTs) {
      return "inRange";
    }
  }

  if (dateStr === today) {
    return "today";
  }

  return "default";
}

export function getCalendarDayEndpointLabel(
  config: CalendarPickerConfig,
  dateStr: string,
  draft: DateRangeDraft,
): string | null {
  const { start, end } = draft;
  if (start && end && start === end && dateStr === start) {
    return config.sameDayLabel;
  }
  if (start && dateStr === start) return config.startLabel;
  if (end && dateStr === end) return config.endLabel;
  return null;
}

export function getCalendarCellTooltip(
  config: CalendarPickerConfig,
  draft: DateRangeDraft,
  date: string,
  hint?: string,
): string | undefined {
  if (config.selection === "range") {
    if (draft.start === date && !draft.end) {
      return config.partialHint;
    }
    if (draft.end === date && draft.start && draft.end && hint?.startsWith("共")) {
      return hint;
    }
  }
  return undefined;
}

export function formatMonthLabel(year: number, month: number): string {
  return `${year}年${String(month).padStart(2, "0")}月`;
}

export function buildMonthWeeks(year: number, month: number): CalendarDayCell[][] {
  const first = new Date(year, month - 1, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells: CalendarDayCell[] = [];

  for (let i = 0; i < startWeekday; i++) {
    cells.push({ date: null, isCurrentMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatLocalDateString(new Date(year, month - 1, day));
    cells.push({ date: dateStr, isCurrentMonth: true });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ date: null, isCurrentMonth: false });
  }

  const weeks: CalendarDayCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return weeks;
}

export function buildInitialMonths(startDate: string, count = 4): CalendarMonth[] {
  const parsed = parseLocalDate(startDate) ?? parseLocalDate(todayDateString())!;
  let year = parsed.getFullYear();
  let month = parsed.getMonth() + 1;

  const months: CalendarMonth[] = [];
  for (let i = 0; i < count; i++) {
    months.push({
      year,
      month,
      label: formatMonthLabel(year, month),
      weeks: buildMonthWeeks(year, month),
    });
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return months;
}

function monthIndex(year: number, month: number): number {
  return year * 12 + month;
}

export function prependPreviousMonths(
  months: CalendarMonth[],
  count = 2,
  minDate: string,
): CalendarMonth[] {
  if (!months.length) return buildInitialMonths(minDate, count);

  const minParsed = parseLocalDate(minDate) ?? parseLocalDate(todayDateString())!;
  const minIndex = monthIndex(minParsed.getFullYear(), minParsed.getMonth() + 1);

  const first = months[0]!;
  let year = first.year;
  let month = first.month - 1;
  if (month < 1) {
    month = 12;
    year -= 1;
  }

  const prepended: CalendarMonth[] = [];
  for (let i = 0; i < count; i++) {
    if (monthIndex(year, month) < minIndex) break;
    prepended.unshift({
      year,
      month,
      label: formatMonthLabel(year, month),
      weeks: buildMonthWeeks(year, month),
    });
    month -= 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
  }

  return prepended.length ? [...prepended, ...months] : months;
}

export function appendNextMonths(months: CalendarMonth[], count = 3): CalendarMonth[] {
  if (!months.length) return buildInitialMonths(todayDateString(), count);

  const last = months[months.length - 1]!;
  let year = last.year;
  let month = last.month + 1;
  if (month > 12) {
    month = 1;
    year += 1;
  }

  const next: CalendarMonth[] = [];
  for (let i = 0; i < count; i++) {
    next.push({
      year,
      month,
      label: formatMonthLabel(year, month),
      weeks: buildMonthWeeks(year, month),
    });
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return next;
}

export function monthSectionId(year: number, month: number): string {
  return `calendar-month-${year}-${String(month).padStart(2, "0")}`;
}
