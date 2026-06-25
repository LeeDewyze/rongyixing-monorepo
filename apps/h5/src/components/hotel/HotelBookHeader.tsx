import {
  HOTEL_CHROME,
  HOTEL_DETAIL_FONT,
  HOTEL_HEADER_GRADIENT,
} from "@/components/hotel/hotel-detail-chrome";

interface HotelBookHeaderProps {
  onBack: () => void;
}

function BackIcon() {
  return (
    <svg viewBox="0 0 10 17" className="h-[17px] w-[10px] shrink-0 text-[#010101]" aria-hidden>
      <path
        d="M9 1.5 2.5 8.5 9 15.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HotelBookHeader({ onBack }: HotelBookHeaderProps) {
  return (
    <div
      className={`fixed inset-x-0 top-0 z-30 shadow-[0_2px_12px_rgba(142,200,255,0.35)] ${HOTEL_DETAIL_FONT}`}
      style={{ background: HOTEL_HEADER_GRADIENT }}
    >
      <div className="pt-[env(safe-area-inset-top)]">
        <div className="flex h-12 items-center px-2.5">
          <button
            type="button"
            onClick={onBack}
            className="flex h-10 w-9 shrink-0 items-center justify-center rounded-full active:bg-white/40"
            aria-label="返回"
          >
            <BackIcon />
          </button>

          <h1
            className="min-w-0 flex-1 text-center text-[16px] font-semibold leading-tight tracking-tight"
            style={{ color: HOTEL_CHROME.title }}
          >
            填写订单
          </h1>

          {/* Balance back button width for centered title */}
          <span className="w-9 shrink-0" aria-hidden />
        </div>
      </div>
    </div>
  );
}
