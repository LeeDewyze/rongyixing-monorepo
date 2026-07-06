import { useState } from "react";
import type { HotelCity } from "@ryx/shared-types";

import { WebCalendarIcon, WebSearchButton } from "@/components/home/WebSearchField";
import { HotelStayDatePickerDialog } from "@/components/search/DatePickerDialog";
import { HOME_ASSETS } from "@/config/home-assets";
import { formatHotelDateShort, nightsBetween, relativeDayLabel } from "@/lib/date-search";
import { displayHotelCity } from "@/lib/hotel-search";

interface WebHotelSearchPanelProps {
  city: HotelCity;
  cityLabel?: string;
  keyword: string;
  checkIn: string;
  checkOut: string;
  validationError?: string;
  onCitySelect: () => void;
  onKeywordChange: (value: string) => void;
  onCheckInChange: (date: string) => void;
  onCheckOutChange: (date: string) => void;
  onSearch: () => void;
  onMyLocationClick: () => void;
  myLocationLoading?: boolean;
}

const FIELD_LABEL_CLASS =
  "block text-xs font-normal leading-none text-[#666666] [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]";
const FIELD_VALUE_CLASS =
  "mt-2 block truncate text-[18px] font-normal leading-none text-[#010101] [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]";

export function WebHotelSearchPanel({
  city,
  cityLabel,
  keyword,
  checkIn,
  checkOut,
  validationError,
  onCitySelect,
  onKeywordChange,
  onCheckInChange,
  onCheckOutChange,
  onSearch,
  onMyLocationClick,
  myLocationLoading = false,
}: WebHotelSearchPanelProps) {
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const nights = nightsBetween(checkIn, checkOut);
  const destinationLabel = cityLabel ?? displayHotelCity(city);

  return (
    <>
      <div className="flex items-stretch gap-3">
        <div className="flex h-16 min-w-0 flex-1 items-center gap-3 rounded-xl bg-[#F5F6F9] px-4">
          <button
            type="button"
            className="min-w-0 max-w-[38%] flex-1 shrink-0 text-left"
            onClick={onCitySelect}
          >
            <span className={FIELD_LABEL_CLASS}>目的地</span>
            <span className={FIELD_VALUE_CLASS}>{destinationLabel}</span>
          </button>

          <div className="min-w-0 flex-1">
            <span className={FIELD_LABEL_CLASS}>关键词</span>
            <input
              type="search"
              value={keyword}
              placeholder="位置/品牌/酒店"
              onChange={(e) => onKeywordChange(e.target.value)}
              className={`${FIELD_VALUE_CLASS} w-full border-0 bg-transparent p-0 outline-none placeholder:font-normal placeholder:text-[#999999]`}
            />
          </div>

          <button
            type="button"
            className="flex shrink-0 flex-col items-center gap-0.5 disabled:opacity-60"
            aria-label="我的位置"
            onClick={onMyLocationClick}
            disabled={myLocationLoading}
          >
            <img
              src={HOME_ASSETS.products.hotel.myLocation}
              alt=""
              className="size-5 object-contain"
              aria-hidden
            />
            <span className="text-[11px] leading-none text-[#666666] [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]">
              {myLocationLoading ? "定位中" : "我的位置"}
            </span>
          </button>
        </div>

        <button
          type="button"
          className="flex h-16 min-w-0 flex-1 items-center gap-2 rounded-xl bg-[#F5F6F9] px-4 text-left"
          onClick={() => setDatePickerOpen(true)}
        >
          <span className="min-w-0 flex-1">
            <span className={FIELD_LABEL_CLASS}>入住 / 离店</span>
            <span className={`${FIELD_VALUE_CLASS} whitespace-nowrap`}>
              {formatHotelDateShort(checkIn)}({relativeDayLabel(checkIn)})—
              {formatHotelDateShort(checkOut)}·{nights}晚
            </span>
          </span>
          <WebCalendarIcon />
        </button>

        <WebSearchButton
          label="酒店查询"
          onClick={onSearch}
          className="!h-16 !w-[172px] !min-w-[172px] min-h-0 shrink-0 px-3"
        />
      </div>

      {validationError ? (
        <p className="mt-3 text-center text-sm text-destructive">{validationError}</p>
      ) : null}

      <HotelStayDatePickerDialog
        open={datePickerOpen}
        checkIn={checkIn}
        checkOut={checkOut}
        onClose={() => setDatePickerOpen(false)}
        onConfirm={(nextCheckIn, nextCheckOut) => {
          onCheckInChange(nextCheckIn);
          onCheckOutChange(nextCheckOut);
        }}
      />
    </>
  );
}
