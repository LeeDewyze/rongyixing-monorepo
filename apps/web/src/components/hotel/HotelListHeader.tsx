import { HotelListSearchBar } from "@/components/hotel/HotelListSearchBar";

interface HotelListHeaderProps {
  cityName: string;
  checkIn: string;
  checkOut: string;
  keyword?: string;
  onBack: () => void;
  onCityClick: () => void;
  onDateClick: () => void;
  onKeywordClick: () => void;
  selfBookOnly?: boolean;
  onOpenPolicy?: () => void;
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        d="M15 5l-7 7 7 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HotelListHeader({
  cityName,
  checkIn,
  checkOut,
  keyword,
  onBack,
  onCityClick,
  onDateClick,
  onKeywordClick,
  selfBookOnly = false,
  onOpenPolicy,
}: HotelListHeaderProps) {
  return (
    <div
      className="shrink-0 pb-2 pt-[env(safe-area-inset-top)]"
      style={{ background: "var(--brand-form-header-gradient)" }}
    >
      <div className="flex h-12 items-center px-2.5">
        <button
          type="button"
          className="flex h-10 w-9 shrink-0 items-center justify-center rounded-full text-brand-title active:bg-white/40"
          aria-label="返回"
          onClick={onBack}
        >
          <BackIcon />
        </button>

        <h1
          className="min-w-0 flex-1 truncate text-center text-[17px] font-medium leading-tight text-brand-title"
        >
          酒店列表
        </h1>

        {selfBookOnly ? (
          <button
            type="button"
            className="flex h-10 min-w-[72px] shrink-0 items-center justify-center rounded-md px-1 text-[12px] font-medium text-brand-title active:bg-white/40 disabled:pointer-events-none disabled:opacity-50"
            disabled={!onOpenPolicy}
            onClick={onOpenPolicy}
          >
            差旅标准
          </button>
        ) : (
          <span className="h-10 w-9 shrink-0" aria-hidden />
        )}
      </div>
      <div className="px-3">
        <HotelListSearchBar
          cityName={cityName}
          checkIn={checkIn}
          checkOut={checkOut}
          keyword={keyword}
          onCityClick={onCityClick}
          onDateClick={onDateClick}
          onKeywordClick={onKeywordClick}
        />
      </div>
    </div>
  );
}
