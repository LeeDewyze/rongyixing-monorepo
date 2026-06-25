import type { ReactNode } from "react";

import bookOptionChevronIcon from "@/assets/hotel/book-option-chevron.png";
import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";

function ChevronRightIcon({ inCircle = true }: { inCircle?: boolean }) {
  if (!inCircle) {
    return (
      <img src={bookOptionChevronIcon} alt="" className="size-3 shrink-0 opacity-80" aria-hidden />
    );
  }

  return <img src={bookOptionChevronIcon} alt="" className="size-5 shrink-0" aria-hidden />;
}

interface HotelBookOptionRowProps {
  label: string;
  value: ReactNode;
  required?: boolean;
  onClick: () => void;
  /** `card` — standalone white card; `inline` — row inside another panel */
  variant?: "card" | "inline";
}

export function HotelBookOptionRow({
  label,
  value,
  required = false,
  onClick,
  variant = "card",
}: HotelBookOptionRowProps) {
  const button = (
    <button
      type="button"
      onClick={onClick}
      className={
        variant === "card"
          ? "flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left active:bg-[#FAFBFC]"
          : "flex w-full items-center gap-3 py-3 text-left active:opacity-70"
      }
    >
      <span
        className={
          variant === "card"
            ? "shrink-0 text-[14px] font-semibold text-[#333333]"
            : "w-[5.5rem] shrink-0 whitespace-nowrap text-[14px] text-[#808080]"
        }
      >
        {label}
        {required ? <span className={variant === "card" ? "text-[#FF4D4F]" : ""}> *</span> : null}
      </span>
      {variant === "card" ? (
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[14px] text-[#999999]">{value}</span>
          <ChevronRightIcon />
        </span>
      ) : (
        <>
          <span className="min-w-0 flex-1 truncate text-[14px] text-[#333333]">{value}</span>
          <ChevronRightIcon inCircle={false} />
        </>
      )}
    </button>
  );

  if (variant === "inline") {
    return button;
  }

  return (
    <div
      className={`overflow-hidden rounded-xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${HOTEL_DETAIL_FONT}`}
    >
      {button}
    </div>
  );
}
