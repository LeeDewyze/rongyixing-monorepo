import type { TrainOrderTicket } from "@ryx/shared-types";

import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";

interface TrainOrderPassengerTabsProps {
  tickets: TrainOrderTicket[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export function TrainOrderPassengerTabs({
  tickets,
  selectedIndex,
  onSelect,
}: TrainOrderPassengerTabsProps) {
  if (tickets.length <= 1) {
    return null;
  }

  return (
    <div className={`flex gap-2 overflow-x-auto px-0 py-1 ${HOTEL_DETAIL_FONT}`}>
      {tickets.map((ticket, index) => {
        const active = index === selectedIndex;
        const name = ticket.Traveler?.Name ?? `乘车人${index + 1}`;
        const label = ticket.IsOriginal ? `${name}·原票` : name;
        return (
          <button
            key={ticket.Id}
            type="button"
            onClick={() => onSelect(index)}
            className={`flex h-9 min-w-[5rem] shrink-0 items-center justify-center rounded-[24px] px-4 text-[14px] font-medium transition-colors ${
              active
                ? "bg-[linear-gradient(270deg,#2768FA_0%,#33A1F9_100%)] text-white"
                : "border border-[#2768FA] bg-white text-[#2768FA]"
            }`}
          >
            <span className={`truncate ${ticket.IsOriginal ? "max-w-[7.5rem]" : "max-w-[6rem]"}`}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
