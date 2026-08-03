import { useEffect, useRef } from "react";

import calendarIcon from "@/assets/train/calendar-icon.png";
import {
  buildTrainListDateStripRange,
  parseLocalDate,
  relativeDayLabel,
  todayDateString,
} from "@/lib/date-search";

interface TrainListDateStripProps {
  selectedDate: string;
  onSelect: (date: string) => void;
  onOpenCalendar: () => void;
}

const DATE_MMDD_CLASS =
  "text-[11px] font-normal leading-[100%] tracking-[0] [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]";

const DATE_REL_ACTIVE_CLASS =
  "text-[14px] font-medium leading-[100%] tracking-[0] text-white [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]";

const DATE_REL_INACTIVE_CLASS =
  "text-[13px] font-medium leading-[100%] tracking-[0] text-[#333333] [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]";

/** List page date row — MM-DD + 今天/明天. */
export function TrainListDateStrip({
  selectedDate,
  onSelect,
  onOpenCalendar,
}: TrainListDateStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const anchorDate = parseLocalDate(selectedDate) ? selectedDate : todayDateString();
  const dates = buildTrainListDateStripRange(anchorDate);

  useEffect(() => {
    const el = scrollRef.current?.querySelector(`[data-date="${selectedDate}"]`);
    el?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [selectedDate]);

  return (
    <div className="flex items-stretch bg-gradient-to-b from-[#6aabff] to-[#e4edfd] pb-3 pl-3 pr-0 pt-1">
      <div
        ref={scrollRef}
        className="flex min-w-0 flex-1 gap-2 overflow-x-auto pr-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
              className={`flex h-11 w-[47px] shrink-0 flex-col items-center justify-center gap-1 rounded-lg transition ${
                active
                  ? "bg-[linear-gradient(270deg,#2768FA_0%,#33A1F9_100%)] text-white shadow-sm"
                  : "bg-transparent"
              }`}
            >
              <span className={`${DATE_MMDD_CLASS} ${active ? "text-white" : "text-[#666666]"}`}>
                {mmdd}
              </span>
              <span className={active ? DATE_REL_ACTIVE_CLASS : DATE_REL_INACTIVE_CLASS}>
                {rel}
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onOpenCalendar}
        className="relative z-10 flex size-11 shrink-0 flex-col items-center justify-center bg-[linear-gradient(0.65deg,#CCDFFB_0.46%,#ABCCFD_99.35%)] shadow-[-4px_0_4px_-3px_#03030340] active:opacity-80"
        aria-label="选择日期"
      >
        <img
          src={calendarIcon}
          alt=""
          width={20}
          height={20}
          className="h-5 w-5 shrink-0 object-contain"
          aria-hidden
        />
      </button>
    </div>
  );
}
