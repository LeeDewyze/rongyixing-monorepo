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
    <div className="flex h-[34px] min-w-0 flex-1 items-center rounded-full border-[0.5px] border-[#E5E5E5] bg-white pl-3 pr-2.5 shadow-[0_2px_6px_rgba(229,229,229,0.5)]">
      <button
        type="button"
        className="shrink-0 text-[15px] font-medium leading-none text-[#5099FE]"
        onClick={onCityClick}
      >
        {cityName}
      </button>

      <span className="mx-2 h-5 w-px shrink-0 bg-[rgba(0,0,0,0.08)]" aria-hidden />

      <button
        type="button"
        className="flex shrink-0 flex-col items-start justify-center leading-none"
        onClick={onDateClick}
      >
        <div className="flex items-center gap-1 text-[10px] text-[#808080]">
          <span>住</span>
          <span className="text-[11px] font-medium text-[#5099FE]">
            {formatHotelStayDate(checkIn)}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-1 text-[10px] text-[#808080]">
          <span>离</span>
          <span className="text-[11px] font-medium text-[#5099FE]">
            {formatHotelStayDate(checkOut)}
          </span>
        </div>
      </button>

      <span className="mx-2 h-5 w-px shrink-0 bg-[rgba(0,0,0,0.08)]" aria-hidden />

      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-1 text-left"
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
