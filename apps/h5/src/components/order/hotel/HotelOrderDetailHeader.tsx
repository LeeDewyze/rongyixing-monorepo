import { forwardRef } from "react";

import {
  HOTEL_CHROME,
  HOTEL_DETAIL_FONT,
  HOTEL_HEADER_GRADIENT,
} from "@/components/hotel/hotel-detail-chrome";

/** Toolbar row only; add safe-area via pt on the outer shell. */
export const ORDER_DETAIL_HEADER_FALLBACK_HEIGHT = 48;

interface HotelOrderDetailHeaderProps {
  onBack: () => void;
  variant?: "legacy" | "form";
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

export const HotelOrderDetailHeader = forwardRef<HTMLDivElement, HotelOrderDetailHeaderProps>(
  function HotelOrderDetailHeader({ onBack, variant = "legacy" }, ref) {
    const isFormVariant = variant === "form";

    return (
      <div
        ref={ref}
        className={`fixed inset-x-0 top-0 z-30 mx-auto w-full max-w-lg overflow-hidden ${
          isFormVariant ? "" : "shadow-[0_2px_12px_rgba(142,200,255,0.35)]"
        } ${HOTEL_DETAIL_FONT}`}
        style={{
          background: isFormVariant ? "var(--brand-form-header-gradient)" : HOTEL_HEADER_GRADIENT,
        }}
      >
        <div className="pt-[env(safe-area-inset-top)]">
          <div
            className={
              isFormVariant
                ? "relative flex h-11 items-center px-1"
                : "flex h-12 items-center px-2.5"
            }
          >
            <button
              type="button"
              onClick={onBack}
              className={
                isFormVariant
                  ? "flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center text-2xl text-brand-title active:opacity-70"
                  : "flex h-10 w-9 shrink-0 touch-manipulation items-center justify-center rounded-full active:bg-white/40"
              }
              aria-label="返回"
            >
              {isFormVariant ? "‹" : <BackIcon />}
            </button>
            <h1
              className={
                isFormVariant
                  ? "pointer-events-none absolute inset-x-16 truncate text-center text-base font-semibold text-brand-title"
                  : "min-w-0 flex-1 text-center text-[16px] font-semibold leading-tight tracking-tight"
              }
              style={{ color: isFormVariant ? undefined : HOTEL_CHROME.title }}
            >
              订单详情
            </h1>
            <span
              className={isFormVariant ? "ml-auto h-11 w-11 shrink-0" : "w-9 shrink-0"}
              aria-hidden
            />
          </div>
        </div>
      </div>
    );
  },
);
