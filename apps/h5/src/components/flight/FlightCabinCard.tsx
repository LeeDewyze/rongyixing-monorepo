import type { FlightFare } from "@ryx/shared-types";

import {
  fareBaggageText,
  fareRemainCount,
  formatCabinInfoLine,
  formatFareSalesPrice,
  prepareFlightFareForDisplay,
  shouldShowFareRemainCount,
} from "@/lib/flight-detail";

interface FlightCabinCardProps {
  fare: FlightFare;
  onBook: (fare: FlightFare) => void;
  onShowRules?: (fare: FlightFare) => void;
}

export function FlightCabinCard({ fare, onBook, onShowRules }: FlightCabinCardProps) {
  const cabin = prepareFlightFareForDisplay(fare);
  const remain = fareRemainCount(cabin);
  const showRemain = shouldShowFareRemainCount(cabin);
  const baggage = fareBaggageText(cabin);
  const allowBook = cabin.IsAllowOrder !== false;

  return (
    <div className="overflow-hidden rounded-xl bg-white px-3 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-1.5">
            <p className="text-[22px] font-bold leading-none text-[#de6f00]">
              <span className="text-[13px] font-semibold">¥ </span>
              {formatFareSalesPrice(cabin.SalesPrice)}
            </p>
            {cabin.IsAgreement ? (
              <span className="mt-0.5 rounded bg-[#eef3ff] px-1.5 py-0.5 text-[11px] font-semibold text-[#5099fe]">
                协
              </span>
            ) : null}
          </div>

          <p className="mt-2 text-[13px] leading-snug text-[#333333]">{formatCabinInfoLine(cabin)}</p>

          {baggage ? (
            <p className="mt-1 text-[12px] leading-snug text-[#666666]">{baggage}</p>
          ) : null}

          <button
            type="button"
            className="mt-2 flex w-full items-center justify-between gap-3 text-left text-[12px]"
            onClick={() => onShowRules?.(cabin)}
          >
            <span className="text-[#333333]">
              {showRemain && remain != null ? `余票${remain}张` : "\u00a0"}
            </span>
            <span className="shrink-0 text-[#5099fe]">退改签政策详情 &gt;</span>
          </button>
        </div>

        <div className="flex shrink-0 flex-col items-center justify-center gap-2 self-stretch pt-1">
          <button
            type="button"
            disabled={!allowBook}
            className={`min-w-[4.5rem] rounded-md px-4 py-2 text-[13px] font-medium text-white ${
              allowBook ? "bg-[#5099fe] active:opacity-90" : "bg-[#cccccc]"
            }`}
            onClick={() => onBook(cabin)}
          >
            预订
          </button>
        </div>
      </div>
    </div>
  );
}
