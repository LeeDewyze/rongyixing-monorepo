import type { ReactNode } from "react";

import { BookSubsectionLabel } from "@/components/book/BookSubsectionLabel";
import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";

interface FlightBookPassengerSectionProps {
  passengers: ReactNode;
  notifyLanguage?: ReactNode;
  serviceFee?: ReactNode;
  authorizedContacts?: ReactNode;
  showAuthorizedLabel?: boolean;
}

/** Flight book passenger block — mirrors hotel room section layout. */
export function FlightBookPassengerSection({
  passengers,
  notifyLanguage,
  serviceFee,
  authorizedContacts,
  showAuthorizedLabel = false,
}: FlightBookPassengerSectionProps) {
  return (
    <section
      className={`overflow-hidden rounded-xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${HOTEL_DETAIL_FONT}`}
    >
      <div className="flex items-center border-b border-[#F0F2F5] bg-[#FAFBFC] px-3.5 py-2.5">
        <span className="inline-flex h-[22px] items-center rounded-[4px] bg-[#2768FA] px-2 text-[12px] font-medium leading-none text-white">
          旅客信息
        </span>
      </div>

      <div className="px-3 pb-4 pt-3">
        <BookSubsectionLabel title="乘机人" />
        {passengers}
      </div>

      {notifyLanguage ? <div className="px-3 pb-4">{notifyLanguage}</div> : null}

      {serviceFee ? (
        <div className="px-3 pb-4">
          <BookSubsectionLabel title="费用" />
          {serviceFee}
        </div>
      ) : null}

      {authorizedContacts ? (
        <div className="border-t border-[#EEF1F6] bg-[#FAFBFC] px-3 py-4">
          {showAuthorizedLabel ? <BookSubsectionLabel title="授权账号" /> : null}
          {authorizedContacts}
        </div>
      ) : null}
    </section>
  );
}
