import { useEffect, useRef } from "react";

import { buildDateRange, formatDayChip, todayDateString } from "@/lib/flight-search";
import { parseLocalDate } from "@/lib/date-search";

interface FlightDateStripProps {
  selectedDate: string;
  onSelect: (date: string) => void;
  days?: number;
  className?: string;
}

/** Horizontal scrollable date chips for list / book flows. */
export function FlightDateStrip({
  selectedDate,
  onSelect,
  days = 14,
  className = "",
}: FlightDateStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const anchorDate =
    parseLocalDate(selectedDate) ? selectedDate : todayDateString();
  const dates = buildDateRange(anchorDate, days);

  useEffect(() => {
    const el = scrollRef.current?.querySelector(`[data-date="${selectedDate}"]`);
    el?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [selectedDate]);

  return (
    <div
      ref={scrollRef}
      className={`flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
    >
      {dates.map((date) => {
        const { weekday, label } = formatDayChip(date);
        const active = date === selectedDate;
        return (
          <button
            key={date}
            type="button"
            data-date={date}
            onClick={() => onSelect(date)}
            className={`flex min-w-[3.5rem] flex-col items-center rounded-lg px-2 py-2 text-center ${
              active
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
            }`}
          >
            <span className="text-[10px] opacity-80">周{weekday}</span>
            <span className="text-sm font-semibold">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
