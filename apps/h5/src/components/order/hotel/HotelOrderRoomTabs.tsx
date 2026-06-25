import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";
import { formatRoomLabel } from "@/lib/hotel-order-detail";

interface HotelOrderRoomTabsProps {
  roomCount: number;
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export function HotelOrderRoomTabs({
  roomCount,
  selectedIndex,
  onSelect,
}: HotelOrderRoomTabsProps) {
  if (roomCount <= 1) {
    return null;
  }

  return (
    <div className={`flex gap-2 overflow-x-auto px-0 py-1 ${HOTEL_DETAIL_FONT}`}>
      {Array.from({ length: roomCount }, (_, index) => {
        const active = index === selectedIndex;
        return (
          <button
            key={index}
            type="button"
            onClick={() => onSelect(index)}
            className={`flex h-9 w-20 shrink-0 items-center justify-center rounded-[24px] text-[14px] font-medium transition-colors ${
              active
                ? "bg-[linear-gradient(270deg,#2768FA_0%,#33A1F9_100%)] text-white"
                : "border border-[#2768FA] bg-white text-[#2768FA]"
            }`}
          >
            {formatRoomLabel(index)}
          </button>
        );
      })}
    </div>
  );
}
