import { forwardRef } from "react";

import { HOTEL_CHROME, HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";

interface HotelBookHeaderProps {
  onBack: () => void;
}

function BackIcon() {
  return (
    <svg viewBox="0 0 10 17" className="h-[17px] w-[10px] shrink-0 text-brand-title" aria-hidden>
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

export const HotelBookHeader = forwardRef<HTMLDivElement, HotelBookHeaderProps>(
  function HotelBookHeader({ onBack }, ref) {
    return (
      <div
        ref={ref}
        className={`fixed inset-x-0 top-0 z-30 w-full ${HOTEL_DETAIL_FONT}`}
        style={{ background: "var(--brand-form-header-gradient)" }}
      >
        <div className="pt-[env(safe-area-inset-top)]">
          <div className="relative flex h-11 items-center px-1">
            <button
              type="button"
              onClick={onBack}
              className="flex h-11 w-11 shrink-0 items-center justify-center text-2xl text-brand-title active:opacity-70"
              aria-label="返回"
            >
              <BackIcon />
            </button>

            <h1
              className="pointer-events-none absolute inset-x-11 truncate text-center text-base font-semibold"
              style={{ color: HOTEL_CHROME.title }}
            >
              填写订单
            </h1>

            <span className="w-11 shrink-0" aria-hidden />
          </div>
        </div>
      </div>
    );
  },
);
