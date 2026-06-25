import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";

export function HotelBookReminderBar() {
  return (
    <div
      className={`mx-3 mt-3 rounded-lg bg-[#FFF8E6] px-3.5 py-2.5 ring-1 ring-[#FFE8A3] ${HOTEL_DETAIL_FONT}`}
      role="note"
    >
      <p className="text-[12px] leading-[1.5] text-[#B8860B]">
        请您下单前与酒店确认接待政策，以防影响入住
      </p>
    </div>
  );
}
