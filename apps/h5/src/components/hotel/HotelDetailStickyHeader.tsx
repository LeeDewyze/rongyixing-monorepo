import { Link } from "react-router-dom";

import { HOTEL_CHROME, HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";

interface HotelDetailStickyHeaderProps {
  hotelName: string;
  passengerCount: number;
  passengerHref: string;
  canFilterPolicy: boolean;
  onBack: () => void;
  onOpenPolicyFilter: () => void;
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

export function HotelDetailStickyHeader({
  hotelName,
  passengerCount,
  passengerHref,
  canFilterPolicy,
  onBack,
  onOpenPolicyFilter,
}: HotelDetailStickyHeaderProps) {
  return (
    <div className={`pt-[env(safe-area-inset-top)] ${HOTEL_DETAIL_FONT}`}>
      <div className="flex h-12 items-center gap-2 px-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-12 w-8 shrink-0 items-center justify-center active:opacity-70"
          aria-label="返回"
        >
          <BackIcon />
        </button>

        <h1
          className="min-w-0 flex-1 truncate text-[16px] font-semibold leading-tight"
          style={{ color: HOTEL_CHROME.title }}
        >
          {hotelName}
        </h1>

        <div className="flex shrink-0 items-center gap-4">
          <button
            type="button"
            disabled={!canFilterPolicy}
            onClick={onOpenPolicyFilter}
            className="text-[14px] font-medium active:opacity-70 disabled:font-normal"
            style={{ color: canFilterPolicy ? HOTEL_CHROME.action : HOTEL_CHROME.actionDisabled }}
          >
            过滤差标
          </button>
          <Link
            to={passengerHref}
            className="relative inline-flex items-center gap-1.5 text-[14px] font-medium active:opacity-70"
            style={{ color: HOTEL_CHROME.action }}
          >
            <span>添加旅客</span>
            {passengerCount > 0 ? (
              <span className="flex size-5 items-center justify-center rounded-full bg-[#E72932] text-[11px] font-medium leading-none text-white">
                {passengerCount}
              </span>
            ) : null}
          </Link>
        </div>
      </div>
    </div>
  );
}
