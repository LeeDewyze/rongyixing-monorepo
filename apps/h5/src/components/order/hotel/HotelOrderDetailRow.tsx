import type { ReactNode } from "react";

import {
  HOTEL_ORDER_ROW_LABEL,
  HOTEL_ORDER_ROW_VALUE,
} from "@/components/hotel/hotel-detail-chrome";

interface HotelOrderDetailRowProps {
  label: string;
  value: ReactNode;
  valueClassName?: string;
}

export function HotelOrderDetailRow({
  label,
  value,
  valueClassName = "",
}: HotelOrderDetailRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className={`shrink-0 ${HOTEL_ORDER_ROW_LABEL}`}>{label}</span>
      <span className={`min-w-0 break-all ${HOTEL_ORDER_ROW_VALUE} ${valueClassName}`}>
        {value}
      </span>
    </div>
  );
}
