import type { ReactNode } from "react";

import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";

interface FlightBookPassengerSectionProps {
  passengers: ReactNode;
  notifyLanguage?: ReactNode;
  serviceFee?: ReactNode;
  /** When multiple passengers — badge shows 旅客1, 旅客2, … */
  passengerIndex?: number;
}

/** Flight book passenger block — mirrors hotel room section layout. */
export function FlightBookPassengerSection({
  passengers,
  notifyLanguage,
  serviceFee,
  passengerIndex,
}: FlightBookPassengerSectionProps) {
  const badgeLabel = passengerIndex != null ? `旅客${passengerIndex}` : "旅客信息";

  return (
    <section
      className={`overflow-hidden rounded-xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${HOTEL_DETAIL_FONT}`}
    >
      <div className="flex items-center border-b border-[#F0F2F5] bg-[#FAFBFC] px-3.5 py-2.5">
        <span className="inline-flex h-[22px] items-center rounded-[4px] bg-[#2768FA] px-2 text-[12px] font-medium leading-none text-white">
          {badgeLabel}
        </span>
      </div>

      <div className="px-3 pb-4 pt-3">{passengers}</div>

      {notifyLanguage ? <div className="px-3 pb-4">{notifyLanguage}</div> : null}

      {serviceFee ? <div className="px-3 pb-4">{serviceFee}</div> : null}
    </section>
  );
}
