import { useRef } from "react";
import type { HotelCity } from "@ryx/shared-types";

import {
  formatHotelDateShort,
  nightsBetween,
  relativeDayLabel,
  todayDateString,
} from "@/lib/date-search";
import { displayHotelCity } from "@/lib/hotel-search";
import { HOME_ASSETS } from "@/config/home-assets";

interface HomeHotelSearchPanelProps {
  city: HotelCity;
  keyword: string;
  checkIn: string;
  checkOut: string;
  validationError?: string;
  onCitySelect: () => void;
  onKeywordChange: (value: string) => void;
  onSearch: () => void;
  onCheckInChange: (date: string) => void;
  onCheckOutChange: (date: string) => void;
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 12 12" className="size-4 shrink-0 text-[#666666]" aria-hidden>
      <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function MyLocationIcon() {
  return (
    <img
      src={HOME_ASSETS.products.hotel.myLocation}
      alt=""
      className="size-4 shrink-0 object-contain"
      aria-hidden
    />
  );
}

export function HomeHotelSearchPanel({
  city,
  keyword,
  checkIn,
  checkOut,
  validationError,
  onCitySelect,
  onKeywordChange,
  onSearch,
  onCheckInChange,
  onCheckOutChange,
}: HomeHotelSearchPanelProps) {
  const checkInRef = useRef<HTMLInputElement>(null);
  const checkOutRef = useRef<HTMLInputElement>(null);
  const minDate = todayDateString();
  const nights = nightsBetween(checkIn, checkOut);

  return (
    <div className="mx-3 rounded-lg bg-white px-3 pb-4 pt-3">
      <div className="flex h-12 items-center gap-2 rounded-lg bg-[#F5F6F9] px-3">
        <button
          type="button"
          className="flex shrink-0 items-center gap-0.5 text-[17px] font-medium text-[#010101]"
          onClick={onCitySelect}
        >
          {displayHotelCity(city)}
          <ChevronDownIcon />
        </button>
        <input
          type="search"
          value={keyword}
          placeholder="位置/品牌/酒店"
          onChange={(e) => onKeywordChange(e.target.value)}
          className="min-w-0 flex-1 border-0 bg-transparent text-[17px] font-medium text-[#010101] outline-none placeholder:font-normal placeholder:text-[#999999]"
        />
        <button
          type="button"
          className="flex shrink-0 flex-col items-center gap-0.5"
          aria-label="我的位置"
        >
          <MyLocationIcon />
          <span className="text-right text-[11px] font-normal leading-none tracking-normal text-[#666666] [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]">
            我的位置
          </span>
        </button>
      </div>

      <div className="mt-2 flex h-12 items-center rounded-lg bg-[#F5F6F9] px-3">
        <button
          type="button"
          className="flex items-baseline gap-1 text-left"
          onClick={() => checkInRef.current?.showPicker?.()}
        >
          <span className="text-[17px] font-medium text-[#010101]">
            {formatHotelDateShort(checkIn)}
          </span>
          <span className="text-[14px] text-[#666666]">{relativeDayLabel(checkIn)}</span>
        </button>
        <span className="mx-2 shrink-0 text-[14px] text-[#666666]">——</span>
        <button
          type="button"
          className="flex items-baseline gap-1 text-left"
          onClick={() => checkOutRef.current?.showPicker?.()}
        >
          <span className="text-[17px] font-medium text-[#010101]">
            {formatHotelDateShort(checkOut)}
          </span>
          <span className="text-[14px] text-[#666666]">{relativeDayLabel(checkOut)}</span>
        </button>
        <span className="ml-auto shrink-0 text-[11px] text-[#666666]">共{nights}晚</span>
        <input
          ref={checkInRef}
          type="date"
          className="sr-only"
          tabIndex={-1}
          value={checkIn}
          min={minDate}
          onChange={(e) => onCheckInChange(e.target.value)}
        />
        <input
          ref={checkOutRef}
          type="date"
          className="sr-only"
          tabIndex={-1}
          value={checkOut}
          min={checkIn || minDate}
          onChange={(e) => onCheckOutChange(e.target.value)}
        />
      </div>

      {validationError ? (
        <p className="pt-2 text-center text-sm text-destructive">{validationError}</p>
      ) : null}

      <button
        type="button"
        className="mt-4 flex h-10 w-full items-center justify-center rounded-[24px] text-[17px] font-medium text-white active:opacity-90"
        style={{
          background: "linear-gradient(270deg, #2768FA 0%, #33A1F9 100%)",
          boxShadow: "0px 2px 16px 0px rgba(175, 175, 175, 0.2)",
        }}
        onClick={onSearch}
      >
        酒店查询
      </button>
    </div>
  );
}
