import type { CalendarPickerConfig, DateRangeDraft } from "@/lib/calendar-picker";
import {
  CALENDAR_WEEKDAY_LABELS,
  getCalendarDayCellState,
  getCalendarDayEndpointLabel,
} from "@/lib/calendar-picker";
import { todayDateString } from "@/lib/date-search";

interface CalendarDayProps {
  date: string;
  draft: DateRangeDraft;
  config: CalendarPickerConfig;
  minDate: string;
  maxDate?: string;
  tooltip?: string;
  dayOfWeek?: number;
  onSelect: (date: string) => void;
}

function parseLocalDateSafe(dateStr: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function dayModifierClass(
  state: ReturnType<typeof getCalendarDayCellState>,
  isWeekend: boolean,
  isToday: boolean,
  dayOfWeek?: number,
): string {
  const classes = ["calendar-day"];

  if (state === "disabled") classes.push("calendar-day--disabled");
  if (isWeekend && state !== "disabled") classes.push("calendar-day--weekend");
  if (isToday && state !== "disabled") classes.push("calendar-day--today");

  if (dayOfWeek === 0) classes.push("calendar-day--weekStart");
  if (dayOfWeek === 6) classes.push("calendar-day--weekEnd");

  switch (state) {
    case "rangeStart":
      classes.push("calendar-day--rangeStart", "calendar-day--endpoint");
      break;
    case "rangeEnd":
      classes.push("calendar-day--rangeEnd", "calendar-day--endpoint");
      break;
    case "sameDayEndpoint":
      classes.push("calendar-day--sameDayEndpoint", "calendar-day--endpoint");
      break;
    case "inRange":
      classes.push("calendar-day--inRange");
      break;
    default:
      break;
  }

  return classes.join(" ");
}

function showRangeBar(
  state: ReturnType<typeof getCalendarDayCellState>,
  draft: DateRangeDraft,
): boolean {
  if (!draft.start || !draft.end) return false;
  return state === "rangeStart" || state === "rangeEnd" || state === "inRange";
}

function DaySelectionTooltip({ message }: { message: string }) {
  return (
    <div className="calendar-day__tooltip" role="status" aria-live="polite">
      <div className="calendar-day__tooltip-bubble">{message}</div>
      <span className="calendar-day__tooltip-arrow" aria-hidden />
    </div>
  );
}

export function CalendarDay({
  date,
  draft,
  config,
  minDate,
  maxDate,
  tooltip,
  dayOfWeek,
  onSelect,
}: CalendarDayProps) {
  const state = getCalendarDayCellState(date, draft, minDate, maxDate);
  const d = parseLocalDateSafe(date);
  const isWeekend = d ? d.getDay() === 0 || d.getDay() === 6 : false;
  const endpointLabel = getCalendarDayEndpointLabel(config, date, draft);
  const disabled = state === "disabled";
  const today = todayDateString();
  const isToday = date === today;
  const isEndpoint = state === "rangeStart" || state === "rangeEnd" || state === "sameDayEndpoint";

  return (
    <div className={dayModifierClass(state, isWeekend, isToday, dayOfWeek)}>
      {showRangeBar(state, draft) ? <span className="calendar-day__range" aria-hidden /> : null}
      {tooltip ? <DaySelectionTooltip message={tooltip} /> : null}
      <button
        type="button"
        disabled={disabled}
        className="calendar-day__button"
        onClick={() => !disabled && onSelect(date)}
      >
        <span>{isToday && !isEndpoint ? "今天" : String(Number(date.slice(8, 10)))}</span>
        {endpointLabel ? <span className="calendar-day__label">{endpointLabel}</span> : null}
      </button>
    </div>
  );
}

export function CalendarWeekdayHeader() {
  return (
    <div className="calendar-weekday-header">
      {CALENDAR_WEEKDAY_LABELS.map((label, index) => (
        <div
          key={label}
          className={`calendar-weekday-header__cell${
            index === 0 || index === 6 ? " calendar-weekday-header__cell--weekend" : ""
          }`}
        >
          {label}
        </div>
      ))}
    </div>
  );
}
