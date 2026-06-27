import type { CSSProperties, ReactNode } from "react";

import {
  HOTEL_CHROME,
  HOTEL_DETAIL_FONT,
  HOTEL_HEADER_GRADIENT,
} from "@/components/hotel/hotel-detail-chrome";
import { BRAND_HEADER_BG } from "@/config/brand";

export type AppHeaderTone = "brand" | "hotel";

export interface AppHeaderProps {
  title?: ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  right?: ReactNode;
  /** Content below the toolbar, still inside the header block. */
  extended?: ReactNode;
  tone?: AppHeaderTone;
}

function HotelBackIcon() {
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

export function AppHeader({
  title,
  showBack = false,
  onBack,
  right,
  extended,
  tone = "brand",
}: AppHeaderProps) {
  const isHotel = tone === "hotel";
  const headerStyle: CSSProperties = isHotel
    ? { background: HOTEL_HEADER_GRADIENT }
    : { backgroundColor: BRAND_HEADER_BG };

  return (
    <header
      className={
        isHotel
          ? `sticky top-0 z-50 shrink-0 shadow-[0_2px_12px_rgba(142,200,255,0.35)] ${HOTEL_DETAIL_FONT}`
          : "sticky top-0 z-50 shrink-0 text-white"
      }
      style={headerStyle}
    >
      <div className="pt-[env(safe-area-inset-top)]">
        {isHotel ? (
          <div className="flex h-12 items-center px-2.5">
            {showBack ? (
              <button
                type="button"
                className="flex h-10 w-9 shrink-0 touch-manipulation items-center justify-center rounded-full active:bg-white/40"
                onClick={onBack}
                aria-label="返回"
              >
                <HotelBackIcon />
              </button>
            ) : (
              <span className="w-9 shrink-0" aria-hidden />
            )}
            <h1
              className="min-w-0 flex-1 text-center text-[16px] font-semibold leading-tight tracking-tight"
              style={{ color: HOTEL_CHROME.title }}
            >
              {title}
            </h1>
            <div className="flex w-9 shrink-0 items-center justify-end">{right ?? null}</div>
          </div>
        ) : (
          <div className="relative flex h-11 items-center px-1">
            <div className="flex w-12 shrink-0 items-center justify-start">
              {showBack ? (
                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center text-2xl leading-none active:opacity-70"
                  onClick={onBack}
                  aria-label="返回"
                >
                  ‹
                </button>
              ) : (
                <span className="w-11" aria-hidden />
              )}
            </div>
            <div className="pointer-events-none absolute inset-x-12 flex h-11 items-center justify-center px-2">
              {title ? <h1 className="truncate text-base font-medium">{title}</h1> : null}
            </div>
            <div className="ml-auto flex w-12 shrink-0 items-center justify-end pr-1">
              {right ?? null}
            </div>
          </div>
        )}
        {extended}
      </div>
    </header>
  );
}
