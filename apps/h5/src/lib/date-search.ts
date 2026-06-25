const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Format a local calendar date as YYYY-MM-DD (avoids UTC shift from toISOString). */
export function formatLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseLocalDate(dateStr: string): Date | null {
  if (!DATE_RE.test(dateStr)) return null;
  const d = new Date(`${dateStr}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function todayDateString(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return formatLocalDateString(d);
}

export function addDays(dateStr: string, days: number): string {
  const parsed = parseLocalDate(dateStr);
  const d = parsed ?? new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return formatLocalDateString(d);
}

export function formatDateLabel(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  if (!d) return dateStr;
  const week = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
  return `${dateStr.slice(5).replace("-", "月")}日 周${week}`;
}

export function formatDayChip(dateStr: string): { weekday: string; label: string } {
  const d = parseLocalDate(dateStr);
  const weekday = d ? ["日", "一", "二", "三", "四", "五", "六"][d.getDay()] : "—";
  return {
    weekday,
    label: `${dateStr.slice(5).replace("-", "/")}`,
  };
}

export function buildDateRange(startDate: string, days = 14): string[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parsed = parseLocalDate(startDate);
  const base = !parsed || parsed < today ? today : parsed;

  return Array.from({ length: days }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return formatLocalDateString(d);
  });
}

/** List date strip: from max(today, selected - daysBefore) through selected + daysAfter. */
export function buildListDateStripRange(
  selectedDate: string,
  daysBefore = 7,
  daysAfter = 13,
): string[] {
  const today = todayDateString();
  const anchor = parseLocalDate(selectedDate) ? selectedDate : today;
  let start = addDays(anchor, -daysBefore);
  if (start < today) {
    start = today;
  }
  const end = addDays(anchor, daysAfter);

  const dates: string[] = [];
  for (let current = start; current <= end; current = addDays(current, 1)) {
    dates.push(current);
  }
  return dates;
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  const a = parseLocalDate(checkIn)?.getTime() ?? NaN;
  const b = parseLocalDate(checkOut)?.getTime() ?? NaN;
  const nights = Math.round((b - a) / 86400000);
  return nights > 0 ? nights : 1;
}

/** e.g. `3月1日` for hotel search card */
export function formatHotelDateShort(dateStr: string): string {
  const month = Number.parseInt(dateStr.slice(5, 7), 10);
  const day = Number.parseInt(dateStr.slice(8, 10), 10);
  return `${month}月${day}日`;
}

/** e.g. `05-24` for hotel list header */
export function formatHotelStayDate(dateStr: string): string {
  return dateStr.slice(5);
}

/** Relative day label: 今天 / 明天 / 周X */
export function relativeDayLabel(dateStr: string): string {
  const today = todayDateString();
  if (dateStr === today) return "今天";
  if (dateStr === addDays(today, 1)) return "明天";
  const d = parseLocalDate(dateStr);
  if (!d) return "";
  return `周${["日", "一", "二", "三", "四", "五", "六"][d.getDay()]}`;
}
