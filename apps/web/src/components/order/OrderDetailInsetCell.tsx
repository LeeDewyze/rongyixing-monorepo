import type { ReactNode } from "react";

import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";

export const ORDER_DETAIL_INSET_CELL_CLASS =
  "flex h-11 items-center justify-between gap-3 rounded-lg bg-[#F5F6F9] px-3.5";

export const ORDER_DETAIL_INSET_LABEL_CLASS = `${HOTEL_DETAIL_FONT} shrink-0 text-[16px] font-[500] leading-[100%] tracking-[0] text-[#010101]`;

export const ORDER_DETAIL_INSET_VALUE_CLASS = `${HOTEL_DETAIL_FONT} min-w-0 truncate text-right text-[14px] font-[400] leading-[100%] tracking-[0] tabular-nums text-[#666666]`;

interface OrderDetailInsetCellProps {
  label: string;
  value: ReactNode;
  valueClassName?: string;
  /** Allow multi-part values (e.g. credential number + type). */
  multilineValue?: boolean;
}

export function OrderDetailInsetCell({
  label,
  value,
  valueClassName = "",
  multilineValue = false,
}: OrderDetailInsetCellProps) {
  return (
    <div className={ORDER_DETAIL_INSET_CELL_CLASS}>
      <span className={ORDER_DETAIL_INSET_LABEL_CLASS}>{label}</span>
      <span
        className={`${ORDER_DETAIL_INSET_VALUE_CLASS} ${multilineValue ? "overflow-hidden" : "truncate"} ${valueClassName}`}
      >
        {value}
      </span>
    </div>
  );
}
