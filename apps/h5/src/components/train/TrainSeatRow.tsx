import type { TrainBedInfo, TrainSeat } from "@ryx/shared-types";

import {
  COLLAPSED_SEAT_PREVIEW_LIMIT,
  formatExpandedSeatAvailability,
  formatSeatAvailability,
  formatSeatDiscountRate,
  formatSeatPriceLabel,
  formatSeatTypeDisplayName,
  formatSeatTypeShortName,
} from "@/utils/train-list";

interface TrainSeatRowProps {
  seats: TrainSeat[];
  expanded: boolean;
  onBookAttempt: () => void;
}

const FONT = "[font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]";

const SEAT_TYPE_PREVIEW_CLASS = `text-[12px] font-normal leading-[100%] tracking-[0] text-[#666666] ${FONT}`;

const SEAT_AVAILABILITY_PREVIEW_CLASS = `text-[12px] font-normal leading-[100%] tracking-[0] text-brand-primary ${FONT}`;

const SEAT_SCARCE_PREVIEW_CLASS = `text-[12px] font-normal leading-[100%] tracking-[0] text-[#ff4d4f] ${FONT}`;

const SEAT_TYPE_ROW_CLASS = `w-10 shrink-0 text-[13px] font-medium leading-[100%] tracking-[0] text-[#333333] ${FONT}`;

const SEAT_PRICE_ROW_CLASS = `text-[14px] font-medium leading-[100%] tracking-[0] text-[#DE6F00] ${FONT}`;

const SEAT_DISCOUNT_CLASS = `rounded border border-[#E5E5E5] px-1 text-[10px] font-normal leading-[100%] tracking-[0] text-[#999999] ${FONT}`;

const SEAT_AVAILABILITY_AVAILABLE_CLASS = `text-[12px] font-normal leading-[100%] tracking-[0] text-[#34C759] ${FONT}`;

const SEAT_AVAILABILITY_SCARCE_CLASS = `text-[12px] font-normal leading-[100%] tracking-[0] text-[#FF383C] ${FONT}`;

const SEAT_AVAILABILITY_NONE_CLASS = `text-[12px] font-normal leading-[100%] tracking-[0] text-[#999999] ${FONT}`;

function getExpandedAvailabilityClass(
  availability: ReturnType<typeof formatExpandedSeatAvailability>,
): string {
  if (availability.text === "无票") return SEAT_AVAILABILITY_NONE_CLASS;
  if (availability.scarce) return SEAT_AVAILABILITY_SCARCE_CLASS;
  return SEAT_AVAILABILITY_AVAILABLE_CLASS;
}

function BerthPriceLine({ bedInfos }: { bedInfos: TrainBedInfo[] }) {
  return (
    <div
      className={`mt-2 flex flex-wrap items-center gap-x-2 text-[11px] leading-[100%] text-[#666666] ${FONT}`}
    >
      {bedInfos.map((bed, index) => (
        <span
          key={`${bed.BedTypeName ?? "bed"}-${index}`}
          className="inline-flex items-center gap-2"
        >
          {index > 0 ? <span className="text-[#DDDDDD]">|</span> : null}
          <span>
            {bed.BedTypeName}
            <span className="ml-0.5 font-medium text-[#333333]">
              ¥{formatSeatPriceLabel(bed.Price)}
            </span>
          </span>
        </span>
      ))}
    </div>
  );
}

function ExpandedSeatRow({ seat, onBookAttempt }: { seat: TrainSeat; onBookAttempt: () => void }) {
  const availability = formatExpandedSeatAvailability(seat.Count);
  const hasTickets = seat.Count === undefined || seat.Count > 0;
  const discountLabel = formatSeatDiscountRate(seat.Price, seat.TicketPrice);
  const isUnavailable = !hasTickets;

  return (
    <div className={`px-3 py-3 ${isUnavailable ? "opacity-60" : ""}`}>
      <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_auto_auto] items-center gap-x-5">
        <span className={`${SEAT_TYPE_ROW_CLASS} ${isUnavailable ? "text-[#999999]" : ""}`}>
          {formatSeatTypeShortName(seat.SeatTypeName)}
        </span>

        <div className="flex min-w-0 items-center gap-1.5">
          <span className={SEAT_PRICE_ROW_CLASS}>¥{formatSeatPriceLabel(seat.Price)}</span>
          {discountLabel ? <span className={SEAT_DISCOUNT_CLASS}>{discountLabel}</span> : null}
        </div>

        <span className={`justify-self-end ${getExpandedAvailabilityClass(availability)}`}>
          {availability.text}
        </span>

        <button
          type="button"
          disabled={!hasTickets}
          onClick={(event) => {
            event.stopPropagation();
            onBookAttempt();
          }}
          className={`h-7 shrink-0 justify-self-end rounded px-3 text-[12px] font-medium leading-[100%] tracking-[0] ${FONT} ${
            hasTickets ? "bg-brand-header-start text-white active:opacity-90" : "bg-[#EEEEEE] text-[#999999]"
          }`}
        >
          预订
        </button>
      </div>

      {seat.BedInfos && seat.BedInfos.length > 0 ? (
        <BerthPriceLine bedInfos={seat.BedInfos} />
      ) : null}
    </div>
  );
}

export function TrainSeatRow({ seats, expanded, onBookAttempt }: TrainSeatRowProps) {
  if (!seats.length) return null;

  if (!expanded) {
    const previewSeats = seats
      .filter((seat) => (seat.Count ?? 0) > 0)
      .slice(0, COLLAPSED_SEAT_PREVIEW_LIMIT);

    if (!previewSeats.length) return null;

    return (
      <div className="mt-2 grid grid-cols-4 gap-x-5 gap-y-1 border-t border-[#f0f0f0] pt-2">
        {previewSeats.map((seat) => {
          const availability = formatSeatAvailability(seat.Count);
          return (
            <span key={seat.SeatTypeName} className="whitespace-nowrap">
              <span className={SEAT_TYPE_PREVIEW_CLASS}>
                {formatSeatTypeDisplayName(seat.SeatTypeName)}
              </span>{" "}
              <span
                className={
                  availability.scarce ? SEAT_SCARCE_PREVIEW_CLASS : SEAT_AVAILABILITY_PREVIEW_CLASS
                }
              >
                {availability.text}
              </span>
            </span>
          );
        })}
      </div>
    );
  }

  const availableSeats = seats.filter((seat) => (seat.Count ?? 0) > 0);
  if (!availableSeats.length) return null;

  return (
    <div className="mt-3 overflow-hidden rounded-md bg-[#F5F6F9]">
      {availableSeats.map((seat, index) => (
        <div key={seat.SeatTypeName} className={index > 0 ? "border-t border-[#E8E8E8]" : ""}>
          <ExpandedSeatRow seat={seat} onBookAttempt={onBookAttempt} />
        </div>
      ))}
    </div>
  );
}
