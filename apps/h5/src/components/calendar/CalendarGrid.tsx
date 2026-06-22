import { useEffect, useRef, useState } from "react";

import { CalendarDay, CalendarWeekdayHeader } from "./CalendarDay";
import type { CalendarMonth, CalendarPickerConfig, DateRangeDraft } from "@/lib/calendar-picker";
import {
  appendNextMonths,
  buildInitialMonths,
  buildMonthWeeks,
  calendarMaxSelectableDate,
  calendarMinSelectableDate,
  getCalendarCellTooltip,
  monthSectionId,
  prependPreviousMonths,
} from "@/lib/calendar-picker";
import { parseLocalDate, todayDateString } from "@/lib/date-search";

import "./calendar-grid.css";

interface CalendarGridProps {
  config: CalendarPickerConfig;
  draft: DateRangeDraft;
  anchorDate: string;
  hint?: string;
  onSelectDate: (date: string) => void;
}

function MonthGrid({
  month,
  config,
  draft,
  minDate,
  maxDate,
  hint,
  onSelectDate,
}: {
  month: CalendarMonth;
  config: CalendarPickerConfig;
  draft: DateRangeDraft;
  minDate: string;
  maxDate?: string;
  hint?: string;
  onSelectDate: (date: string) => void;
}) {
  const weeks = buildMonthWeeks(month.year, month.month);

  return (
    <section
      id={monthSectionId(month.year, month.month)}
      className="calendar-month"
      aria-label={month.label}
    >
      <h3 className="calendar-month__title">{month.label}</h3>
      <div className="calendar-month__grid">
        <div className="calendar-month__weeks">
          {weeks.flatMap((week, weekIndex) =>
            week.map((cell, dayIndex) => {
              const key = `${month.year}-${month.month}-${weekIndex}-${dayIndex}`;
              if (!cell.date) {
                return <div key={key} className="calendar-month__placeholder" aria-hidden />;
              }
              return (
                <CalendarDay
                  key={key}
                  date={cell.date}
                  draft={draft}
                  config={config}
                  minDate={minDate}
                  maxDate={maxDate}
                  dayOfWeek={dayIndex}
                  tooltip={getCalendarCellTooltip(config, draft, cell.date, hint)}
                  onSelect={onSelectDate}
                />
              );
            }),
          )}
        </div>
      </div>
    </section>
  );
}

export function CalendarGrid({ config, draft, anchorDate, hint, onSelectDate }: CalendarGridProps) {
  const minDate = calendarMinSelectableDate(config);
  const maxDate = calendarMaxSelectableDate(config);
  const scrollRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const [months, setMonths] = useState<CalendarMonth[]>(() => buildInitialMonths(minDate, 4));

  useEffect(() => {
    const scrollTarget = parseLocalDate(anchorDate) ? anchorDate : minDate;
    const parsed = parseLocalDate(scrollTarget) ?? parseLocalDate(todayDateString());
    if (!parsed || !scrollRef.current) return;

    requestAnimationFrame(() => {
      const id = monthSectionId(parsed.getFullYear(), parsed.getMonth() + 1);
      scrollRef.current?.querySelector(`#${id}`)?.scrollIntoView({ block: "start" });
    });
  }, [anchorDate, minDate]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el || loadingRef.current) return;

    if (el.scrollTop < 80) {
      loadingRef.current = true;
      const prevHeight = el.scrollHeight;
      setMonths((current) => {
        const next = prependPreviousMonths(current, 2, minDate);
        if (next.length === current.length) return current;
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop += scrollRef.current.scrollHeight - prevHeight;
          }
        });
        return next;
      });
      loadingRef.current = false;
      return;
    }

    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 120;
    if (!nearBottom) return;

    loadingRef.current = true;
    setMonths((prev) => [...prev, ...appendNextMonths(prev, 3)]);
    loadingRef.current = false;
  }

  return (
    <div className="calendar-grid">
      <CalendarWeekdayHeader />
      <div ref={scrollRef} className="calendar-grid__scroll" onScroll={handleScroll}>
        {months.map((month) => (
          <MonthGrid
            key={`${month.year}-${month.month}`}
            month={month}
            config={config}
            draft={draft}
            minDate={minDate}
            maxDate={maxDate}
            hint={hint}
            onSelectDate={onSelectDate}
          />
        ))}
      </div>
    </div>
  );
}
