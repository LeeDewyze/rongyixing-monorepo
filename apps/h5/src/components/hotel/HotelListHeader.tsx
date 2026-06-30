import { formatHotelStayDate } from "@/lib/date-search";

interface HotelListHeaderProps {
  cityName: string;
  checkIn: string;
  checkOut: string;
  keyword?: string;
  onBack: () => void;
  onModify: () => void;
}

function ModifyTitleCaret() {
  return (
    <svg viewBox="0 0 12 12" className="size-3 shrink-0 opacity-80" aria-hidden>
      <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function HotelListHeader({
  cityName,
  checkIn,
  checkOut,
  keyword,
  onBack,
  onModify,
}: HotelListHeaderProps) {
  const keywordText = keyword?.trim();
  const summary = `${cityName || "酒店"} · ${formatHotelStayDate(checkIn)}-${formatHotelStayDate(
    checkOut,
  )}${keywordText ? ` · ${keywordText}` : ""}`;

  return (
    <div className="shrink-0 bg-gradient-to-b from-brand-header-start to-brand-header-end pt-[env(safe-area-inset-top)]">
      <div className="flex items-center px-1 pb-2 pt-1">
        <button
          type="button"
          className="flex h-11 w-10 shrink-0 items-center justify-center text-[26px] font-light leading-none text-white active:opacity-70"
          aria-label="返回"
          onClick={onBack}
        >
          ‹
        </button>

        <button
          type="button"
          className="flex min-w-0 flex-1 items-center justify-center gap-1 text-[17px] font-medium text-white active:opacity-80"
          onClick={onModify}
        >
          <span className="truncate">{summary}</span>
          <ModifyTitleCaret />
        </button>

        <span className="h-11 w-10 shrink-0" aria-hidden />
      </div>
    </div>
  );
}
