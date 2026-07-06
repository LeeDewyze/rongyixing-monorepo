import { useState } from "react";
import type { Trafficline } from "@ryx/shared-types";

import { WebCalendarIcon, WebSearchButton } from "@/components/home/WebSearchField";
import { DatePickerDialog } from "@/components/search/DatePickerDialog";
import { HOME_ASSETS } from "@/config/home-assets";
import { formatHotelDateShort, relativeDayLabel } from "@/lib/date-search";
import { displayCityName } from "@/lib/flight-search";

interface WebFlightSearchPanelProps {
  fromCity: Trafficline;
  toCity: Trafficline;
  date: string;
  validationError?: string;
  onSelectFrom: () => void;
  onSelectTo: () => void;
  onSwap: () => void;
  onDateChange: (date: string) => void;
  onSearch: () => void;
}

const FIELD_LABEL_CLASS =
  "block text-xs font-normal leading-none text-[#666666] [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]";
const FIELD_VALUE_CLASS =
  "mt-2 block truncate text-[18px] font-normal leading-none text-[#010101] [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]";

export function WebFlightSearchPanel({
  fromCity,
  toCity,
  date,
  validationError,
  onSelectFrom,
  onSelectTo,
  onSwap,
  onDateChange,
  onSearch,
}: WebFlightSearchPanelProps) {
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  return (
    <>
      <div className="flex items-stretch gap-3">
        <div className="flex h-16 min-w-0 flex-1 items-center gap-3 rounded-xl bg-[#F5F6F9] px-4">
          <button type="button" className="min-w-0 flex-1 text-left" onClick={onSelectFrom}>
            <span className={FIELD_LABEL_CLASS}>出发地</span>
            <span className={FIELD_VALUE_CLASS}>{displayCityName(fromCity)}</span>
          </button>

          <button
            type="button"
            className="shrink-0 border-none bg-transparent p-0"
            aria-label="交换出发城市和到达城市"
            onClick={onSwap}
          >
            <img
              src={HOME_ASSETS.products.flight.swapCities}
              alt=""
              className="size-7 object-contain"
              aria-hidden
            />
          </button>

          <button type="button" className="min-w-0 flex-1 text-right" onClick={onSelectTo}>
            <span className={FIELD_LABEL_CLASS}>目的地</span>
            <span className={FIELD_VALUE_CLASS}>{displayCityName(toCity)}</span>
          </button>
        </div>

        <button
          type="button"
          className="flex h-16 min-w-0 flex-1 items-center gap-2 rounded-xl bg-[#F5F6F9] px-4 text-left"
          onClick={() => setDatePickerOpen(true)}
        >
          <span className="min-w-0 flex-1">
            <span className={FIELD_LABEL_CLASS}>出发时间</span>
            <span className={`${FIELD_VALUE_CLASS} whitespace-nowrap`}>
              {formatHotelDateShort(date)}({relativeDayLabel(date)})
            </span>
          </span>
          <WebCalendarIcon />
        </button>

        <WebSearchButton
          label="机票查询"
          onClick={onSearch}
          className="!h-16 !w-[172px] !min-w-[172px] min-h-0 shrink-0 px-3"
        />
      </div>

      {validationError ? (
        <p className="mt-3 text-center text-sm text-destructive">{validationError}</p>
      ) : null}

      <DatePickerDialog
        open={datePickerOpen}
        title="选择出发日期"
        value={date}
        onClose={() => setDatePickerOpen(false)}
        onConfirm={onDateChange}
      />
    </>
  );
}
