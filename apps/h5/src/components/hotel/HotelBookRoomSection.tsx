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
      className={`overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#EEF1F6] ${HOTEL_DETAIL_FONT}`}
    >
      <div className="flex items-center border-b border-[#EEF1F6] bg-[#F6F9FF] px-3.5 py-2.5">
        <span className="inline-flex h-[22px] items-center rounded-[4px] bg-brand-primary px-2 text-[12px] font-medium leading-none text-white shadow-[0_2px_6px_rgba(39,104,250,0.22)]">
          房间{roomIndex}
        </span>
      </div>

      <div className="px-3 pb-4 pt-3.5">{passenger}</div>

      {serviceFee ? <div className="px-3 pb-4">{serviceFee}</div> : null}
    </section>
  );
}
