import searchLocationPinIcon from "@/assets/hotel/search-location-pin.png";
import { formatHotelStayDate } from "@/lib/date-search";

interface HotelListSearchBarProps {
  cityName: string;
  checkIn: string;
  checkOut: string;
  keyword?: string;
  onCityClick: () => void;
  onDateClick: () => void;
  onKeywordClick: () => void;
}

const SEARCH_BAR_DIVIDER_CLASS = "mx-2 h-8 w-0.5 shrink-0 bg-[#D9D9D9]";

function LocationPinIcon() {
  return (
    <img
      src={searchLocationPinIcon}
      alt=""
      className="size-4 shrink-0 object-contain"
      aria-hidden
    />
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-[18px] shrink-0 text-[#B0B0B0]" aria-hidden>
      <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M13 13l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function HotelListSearchBar({
  cityName,
  checkIn,
  checkOut,
  keyword,
  onCityClick,
  onDateClick,
  onKeywordClick,
}: HotelListSearchBarProps) {
  return (
    <div className="flex h-12 w-full items-center rounded-[24px] bg-white px-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <LocationPinIcon />
      <button
        type="button"
        className="ml-1 shrink-0 text-[14px] font-medium leading-none tracking-normal text-brand-title [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]"
        onClick={onCityClick}
      >
        {cityName}
      </button>

      <span className={SEARCH_BAR_DIVIDER_CLASS} aria-hidden />

      <button
        type="button"
        className="flex shrink-0 flex-col items-start justify-center leading-none"
        onClick={onDateClick}
      >
        <div className="flex items-center gap-1 text-[11px] text-[#808080]">
          <span>住</span>
          <span className="font-medium text-brand-primary">{formatHotelStayDate(checkIn)}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-[#808080]">
          <span>离</span>
          <span className="font-medium text-brand-primary">{formatHotelStayDate(checkOut)}</span>
        </div>
      </button>

      <span className={SEARCH_BAR_DIVIDER_CLASS} aria-hidden />

      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
        onClick={onKeywordClick}
      >
        <SearchIcon />
        <span className="truncate text-[13px] text-[#B0B0B0]">
          {keyword?.trim() || "地名/酒店/关键词"}
        </span>
      </button>
    </div>
  );
}
