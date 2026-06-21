import { useEffect, useRef } from "react";

import { buildDateRange } from "@/lib/flight-search";
import { relativeDayLabel, parseLocalDate, todayDateString } from "@/lib/date-search";

interface FlightListDateStripProps {
  selectedDate: string;
  onSelect: (date: string) => void;
  onOpenCalendar: () => void;
  days?: number;
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-5 text-[#5099fe]" aria-hidden>
      <rect x="3" y="4" width="14" height="13" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 8h14M7 2v3M13 2v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/** List page date row — MM-DD + 今天/明天. */
export function FlightListDateStrip({
  selectedDate,
  onSelect,
  onOpenCalendar,
  days = 14,
}: FlightListDateStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const anchorDate =
    parseLocalDate(selectedDate) ? selectedDate : todayDateString();
  const dates = buildDateRange(anchorDate, days);

  useEffect(() => {
    const el = scrollRef.current?.querySelector(`[data-date="${selectedDate}"]`);
    el?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [selectedDate]);

  return (
    <div className="flex items-stretch gap-2 bg-gradient-to-b from-[#6aabff] to-[#eef3ff] px-3 pb-3 pt-1">
      <div
        ref={scrollRef}
        className="flex min-w-0 flex-1 gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {dates.map((date) => {
          const active = date === selectedDate;
          const mmdd = date.slice(5);
          const rel = relativeDayLabel(date);

          return (
            <button
              key={date}
              type="button"
              data-date={date}
              onClick={() => onSelect(date)}
              className={`flex min-w-[4.5rem] shrink-0 flex-col items-center justify-center rounded-lg px-2 py-2 transition ${
                active
                  ? "bg-[#5099fe] text-white shadow-sm"
                  : "bg-white/70 text-[#333333]"
              }`}
            >
              <span className={`text-[13px] font-semibold leading-tight ${active ? "" : "text-[#333]"}`}>
                {mmdd}
                <span className={`ml-0.5 text-[11px] font-normal ${active ? "text-white/90" : "text-[#808080]"}`}>
                  {rel}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onOpenCalendar}
        className="flex w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-white/90 active:opacity-80"
        aria-label="选择日期"
      >
        <CalendarIcon />
      </button>
    </div>
  );
}
