import type { ReactNode } from "react";

import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";

interface FlightBookPassengerSectionProps {
  passengers: ReactNode;
  notifyLanguage?: ReactNode;
  serviceFee?: ReactNode;
  authorizedContacts?: ReactNode;
}

/** Flight book passenger block — mirrors hotel room section layout. */
export function FlightBookPassengerSection({
  passengers,
  notifyLanguage,
  serviceFee,
  authorizedContacts,
}: FlightBookPassengerSectionProps) {
  return (
    <section
      className={`overflow-hidden rounded-xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${HOTEL_DETAIL_FONT}`}
    >
      <div className="flex items-center border-b border-[#F0F2F5] bg-[#FAFBFC] px-3.5 py-2.5">
        <span className="inline-flex h-[22px] items-center rounded-[4px] bg-brand-primary px-2 text-[12px] font-medium leading-none text-white">
          旅客信息
        </span>
      </div>

      <div className="px-3 pb-4 pt-3">{passengers}</div>

      {notifyLanguage ? <div className="px-3 pb-4">{notifyLanguage}</div> : null}

      {serviceFee ? <div className="px-3 pb-4">{serviceFee}</div> : null}

      {authorizedContacts ? (
        <div className="border-t border-[#EEF1F6] bg-[#FAFBFC] px-3 py-4">{authorizedContacts}</div>
      ) : null}
    </section>
  );
}
