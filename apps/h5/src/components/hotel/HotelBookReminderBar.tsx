import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";

export function HotelBookReminderBar() {
  return (
    <div
      className={`rounded-lg bg-white/90 px-3.5 py-2.5 shadow-sm ring-1 ring-[#DCE8FF] ${HOTEL_DETAIL_FONT}`}
      role="note"
    >
      <p className="text-[12px] leading-[1.5] text-[#2768FA]">
        请您下单前与酒店确认接待政策，以防影响入住
      </p>
    </div>
  );
}
