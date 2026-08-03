import type { ReactNode } from "react";

import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";

interface HotelBookRoomSectionProps {
  roomIndex: number;
  passenger: ReactNode;
  serviceFee?: ReactNode;
}

/** One white card per room — passenger and service fee as separate blocks. */
export function HotelBookRoomSection({
  roomIndex,
  passenger,
  serviceFee,
}: HotelBookRoomSectionProps) {
  return (
    <section
      className={`overflow-hidden rounded-xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${HOTEL_DETAIL_FONT}`}
    >
      <div className="flex items-center border-b border-[#F0F2F5] bg-[#FAFBFC] px-3.5 py-2.5">
        <span className="inline-flex h-[22px] items-center rounded-[4px] bg-brand-primary px-2 text-[12px] font-medium leading-none text-white">
          房间{roomIndex}
        </span>
      </div>

      <div className="px-3 pb-4 pt-3">{passenger}</div>

      {serviceFee ? <div className="px-3 pb-4">{serviceFee}</div> : null}
    </section>
  );
}
