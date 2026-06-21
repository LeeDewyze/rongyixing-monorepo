import { useRef, useState } from "react";
import type { HotelCity } from "@ryx/shared-types";

import {
  formatHotelDateShort,
  nightsBetween,
  relativeDayLabel,
  todayDateString,
} from "@/lib/date-search";
import { displayHotelCity } from "@/lib/hotel-search";

type HotelCategoryTab = "domestic" | "bnb" | "hourly" | "special";

const CATEGORY_TABS: { id: HotelCategoryTab; label: string }[] = [
  { id: "domestic", label: "国内" },
  { id: "bnb", label: "民宿" },
  { id: "hourly", label: "钟点房" },
  { id: "special", label: "特价" },
];

interface HotelSearchCardProps {
  city: HotelCity;
  keyword: string;
  checkIn: string;
  checkOut: string;
  validationError?: string;
  onCitySelect: () => void;
  onKeywordChange: (value: string) => void;
  onKeywordClear: () => void;
  onCheckInChange: (date: string) => void;
  onCheckOutChange: (date: string) => void;
  onSearch: () => void;
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 12 12" className="size-2.5 shrink-0 text-[#9CA3AF]" aria-hidden>
      <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
      <path
        d="M4 4l8 8M12 4l-8 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function HotelSearchCard({
  city,
  keyword,
  checkIn,
  checkOut,
  validationError,
  onCitySelect,
  onKeywordChange,
  onKeywordClear,
  onCheckInChange,
  onCheckOutChange,
  onSearch,
}: HotelSearchCardProps) {
  const [category, setCategory] = useState<HotelCategoryTab>("domestic");
  const checkInRef = useRef<HTMLInputElement>(null);
  const checkOutRef = useRef<HTMLInputElement>(null);
  const minDate = todayDateString();
  const nights = nightsBetween(checkIn, checkOut);
  const cityLabel = displayHotelCity(city);

  return (
    <div className="@container overflow-hidden rounded-2xl bg-white shadow-[0_4px_20px_rgba(15,23,42,0.08)]">
      {/* Category tabs */}
      <div className="bg-[#EEF4FF] px-3 py-2.5">
        <div className="flex gap-1 rounded-lg p-0.5">
          {CATEGORY_TABS.map((tab) => {
            const active = category === tab.id;
            const disabled = tab.id !== "domestic";
            return (
              <button
                key={tab.id}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setCategory(tab.id)}
                className={`flex-1 rounded-md py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-white font-medium text-[#1F2937] shadow-sm"
                    : disabled
                      ? "text-[#9CA3AF]"
                      : "text-[#6B7280]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pb-4 pt-3">
        {/* City + keyword row */}
        <div className="flex items-center gap-2 border-b border-[#F3F4F6] pb-3.5 pt-1">
          <button
            type="button"
            className="flex shrink-0 items-center gap-0.5 text-base font-medium text-[#1F2937]"
            onClick={onCitySelect}
          >
            {cityLabel}
            <ChevronDownIcon />
          </button>

          <span className="h-4 w-px shrink-0 bg-[#E5E7EB]" aria-hidden />

          <input
            type="search"
            value={keyword}
            placeholder="位置/品牌/酒店"
            onChange={(e) => onKeywordChange(e.target.value)}
            className="min-w-0 flex-1 border-0 bg-transparent text-base font-semibold text-[#1F2937] outline-none placeholder:font-normal placeholder:text-[#9CA3AF]"
          />

          {keyword ? (
            <button
              type="button"
              className="flex size-7 shrink-0 items-center justify-center rounded-full text-[#9CA3AF] hover:bg-[#F3F4F6]"
              aria-label="清除关键词"
              onClick={onKeywordClear}
            >
              <ClearIcon />
            </button>
          ) : null}

          <button
            type="button"
            className="flex shrink-0 flex-col items-center gap-0.5 text-[#5099FE]"
            aria-label="已选位置"
          >
            <LocationIcon />
            <span className="text-[10px] leading-none">已选位置</span>
          </button>
        </div>

        {/* Date row */}
        <div className="flex items-center border-b border-[#F3F4F6] py-3.5">
          <button
            type="button"
            className="text-left"
            onClick={() => checkInRef.current?.showPicker?.()}
          >
            <span className="text-lg font-semibold text-[#1F2937]">
              {formatHotelDateShort(checkIn)}
            </span>
            <span className="ml-1 text-base font-normal text-[#6B7280]">
              {relativeDayLabel(checkIn)}
            </span>
          </button>
          <span className="mx-2 shrink-0 text-[#9CA3AF]">—</span>
          <button
            type="button"
            className="text-left"
            onClick={() => checkOutRef.current?.showPicker?.()}
          >
            <span className="text-lg font-semibold text-[#1F2937]">
              {formatHotelDateShort(checkOut)}
            </span>
            <span className="ml-1 text-base font-normal text-[#6B7280]">
              {relativeDayLabel(checkOut)}
            </span>
          </button>
          <span className="ml-auto shrink-0 text-sm text-[#9CA3AF]">共{nights}晚</span>
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
          className="mt-4 flex aspect-[640/90] w-full items-center justify-center text-lg font-medium text-white active:opacity-90 [border-radius:calc(100cqw*24/640)]"
          style={{
            background: "linear-gradient(270deg, #2768FA 0%, #33A1F9 100%)",
            boxShadow: "0px 2px 16px 0px rgba(175, 175, 175, 0.2)",
          }}
          onClick={onSearch}
        >
          酒店查询
        </button>
      </div>
    </div>
  );
}
