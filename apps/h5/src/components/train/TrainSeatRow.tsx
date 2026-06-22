import type { TrainSeat } from "@ryx/shared-types";

import { formatSeatAvailability } from "@/utils/train-list";

interface TrainSeatRowProps {
  seats: TrainSeat[];
  expanded: boolean;
  onBookAttempt: () => void;
}

function shortSeatLabel(name?: string): string {
  if (!name) return "";
  return name.replace(/座$/, "");
}

export function TrainSeatRow({ seats, expanded, onBookAttempt }: TrainSeatRowProps) {
  if (!seats.length) return null;

  if (!expanded) {
    return (
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 border-t border-[#f0f0f0] pt-2 text-[12px]">
        {seats.map((seat) => {
          const availability = formatSeatAvailability(seat.Count);
          return (
            <span key={seat.SeatTypeName} className="text-[#666666]">
              {shortSeatLabel(seat.SeatTypeName)}{" "}
              <span className={availability.scarce ? "text-[#ff4d4f]" : "text-[#5099fe]"}>
                {availability.text}
              </span>
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2 border-t border-[#f0f0f0] pt-3">
      {seats.map((seat) => {
        const availability = formatSeatAvailability(seat.Count);
        const hasTickets = seat.Count === undefined || seat.Count > 0;

        return (
          <div
            key={seat.SeatTypeName}
            className="flex items-center justify-between gap-2 text-[13px]"
          >
            <div className="min-w-0 flex-1">
              <span className="font-medium text-[#333333]">{seat.SeatTypeName}</span>
              <span className="ml-2 text-[#999999]">¥{seat.Price ?? 0}</span>
              <span className={`ml-2 ${availability.scarce ? "text-[#ff4d4f]" : "text-[#5099fe]"}`}>
                {availability.text}
              </span>
            </div>
            <button
              type="button"
              disabled={!hasTickets}
              onClick={(event) => {
                event.stopPropagation();
                onBookAttempt();
              }}
              className={`shrink-0 rounded-full px-4 py-1 text-[12px] font-medium ${
                hasTickets
                  ? "bg-[#5099fe] text-white active:opacity-80"
                  : "bg-[#eeeeee] text-[#999999]"
              }`}
            >
              预订
            </button>
          </div>
        );
      })}
    </div>
  );
}
