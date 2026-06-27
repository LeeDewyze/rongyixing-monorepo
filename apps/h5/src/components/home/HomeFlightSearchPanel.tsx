import { useState } from "react";
import type { Trafficline } from "@ryx/shared-types";

import { CalendarPickerSheet } from "@/components/calendar/CalendarPickerSheet";
import { HOME_ASSETS } from "@/config/home-assets";
import { FLIGHT_CALENDAR_CONFIG } from "@/lib/calendar-picker";
import { formatHotelDateShort, relativeDayLabel } from "@/lib/date-search";
import { displayCityName } from "@/lib/flight-search";

const HOME_PANEL_PRIMARY_TEXT =
  "text-[17px] font-medium leading-none tracking-normal text-brand-title [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]";

const HOME_PANEL_SECONDARY_TEXT =
  "text-[14px] font-[400] leading-[100%] tracking-[0] text-[#666666] [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]";

interface HomeFlightSearchPanelProps {
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

function SwapCitiesIcon({ onSwap }: { onSwap: () => void }) {
  return (
    <button
      type="button"
      aria-label="交换出发城市和到达城市"
      className="flex shrink-0 items-center justify-center"
      onClick={onSwap}
    >
      <img
        src={HOME_ASSETS.products.flight.swapCities}
        alt=""
        width={27}
        height={24}
        className="block h-6 w-[27.32px] object-contain"
        aria-hidden
      />
    </button>
  );
}

export function HomeFlightSearchPanel({
  fromCity,
  toCity,
  date,
  validationError,
  onSelectFrom,
  onSelectTo,
  onSwap,
  onDateChange,
  onSearch,
}: HomeFlightSearchPanelProps) {
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  return (
    <>
      <div className="mx-3 rounded-lg bg-white px-3 pb-4 pt-3">
        <div className="flex h-12 items-center gap-2 rounded-lg bg-[#F5F6F9] px-3">
          <button
            type="button"
            className={`min-w-0 flex-1 truncate text-left ${HOME_PANEL_PRIMARY_TEXT}`}
            onClick={onSelectFrom}
          >
            {displayCityName(fromCity)}
          </button>
          <SwapCitiesIcon onSwap={onSwap} />
          <button
            type="button"
            className={`min-w-0 flex-1 truncate text-right ${HOME_PANEL_PRIMARY_TEXT}`}
            onClick={onSelectTo}
          >
            {displayCityName(toCity)}
          </button>
        </div>

        <button
          type="button"
          className="mt-2 flex h-12 w-full items-center rounded-lg bg-[#F5F6F9] px-3 text-left active:opacity-90"
          onClick={() => setDatePickerOpen(true)}
        >
          <span className={HOME_PANEL_PRIMARY_TEXT}>{formatHotelDateShort(date)}</span>
          <span className={`ml-1 ${HOME_PANEL_SECONDARY_TEXT}`}>{relativeDayLabel(date)}</span>
        </button>

        {validationError ? (
          <p className="pt-2 text-center text-sm text-destructive">{validationError}</p>
        ) : null}

        <button
          type="button"
          className="mt-4 flex h-10 w-full items-center justify-center rounded-[24px] text-[17px] font-medium text-white active:opacity-90"
          style={{
            background: "linear-gradient(270deg, var(--brand-btn-end) 0%, var(--brand-btn-start) 100%)",
            boxShadow: "0px 2px 16px 0px rgba(175, 175, 175, 0.2)",
          }}
          onClick={onSearch}
        >
          机票查询
        </button>
      </div>

      <CalendarPickerSheet
        open={datePickerOpen}
        config={FLIGHT_CALENDAR_CONFIG}
        startDate={date}
        endDate={date}
        onClose={() => setDatePickerOpen(false)}
        onConfirm={(selected) => onDateChange(selected)}
      />
    </>
  );
}
