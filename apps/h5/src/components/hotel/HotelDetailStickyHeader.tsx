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

function HeaderActionDivider() {
  return <span className="h-3.5 w-px shrink-0 bg-[#2768FA]/20" aria-hidden />;
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
      <div className="flex h-12 items-center gap-1.5 px-2.5">
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 w-9 shrink-0 items-center justify-center rounded-full active:bg-white/40"
          aria-label="返回"
        >
          <BackIcon />
        </button>

        <h1
          className="min-w-0 flex-1 truncate pr-1 text-[15px] font-semibold leading-tight tracking-tight"
          style={{ color: HOTEL_CHROME.title }}
        >
          {hotelName}
        </h1>

        <div className="flex shrink-0 items-center rounded-full border border-white/80 bg-white/60 py-0.5 pl-0.5 pr-1 shadow-[0_1px_6px_rgba(39,104,250,0.1)] backdrop-blur-[3px]">
          <button
            type="button"
            disabled={!canFilterPolicy}
            onClick={onOpenPolicyFilter}
            className="whitespace-nowrap rounded-full px-2 py-1.5 text-[12px] font-medium leading-none active:bg-white/70 disabled:opacity-50"
            style={{ color: canFilterPolicy ? HOTEL_CHROME.action : HOTEL_CHROME.actionDisabled }}
          >
            过滤差标
          </button>

          <HeaderActionDivider />

          <Link
            to={passengerHref}
            className="relative inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1.5 pr-3 text-[12px] font-medium leading-none active:bg-white/70"
            style={{ color: HOTEL_CHROME.action }}
          >
            添加旅客
            {passengerCount > 0 ? (
              <span className="absolute -right-0.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E72932] px-0.5 text-[10px] font-semibold leading-none text-white ring-2 ring-white/80">
                {passengerCount > 9 ? "9+" : passengerCount}
              </span>
            ) : null}
          </Link>
        </div>
      </div>
    </div>
  );
}
