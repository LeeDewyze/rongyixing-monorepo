import type { FlightSegment } from "@ryx/shared-types";

import { formatFlightTime } from "@/utils/flight-list";
import {
  shortAirportName,
  shouldShowScarceBadge,
  type FlightCardVariant,
} from "@/utils/flight-list-display";

interface FlightSegmentCardProps {
  segment: FlightSegment;
  variant?: FlightCardVariant;
  onClick?: () => void;
}

function FlightRouteArrow({ transfer = false }: { transfer?: boolean }) {
  return (
    <div className="flex flex-col items-center px-1">
      <div className="relative flex h-3 w-[4.5rem] items-center">
        <div className="h-px flex-1 bg-gradient-to-r from-[#5099fe]/20 to-[#5099fe]" />
        <svg viewBox="0 0 8 8" className="size-2 shrink-0 text-[#5099fe]" aria-hidden>
          <path d="M1 1l5 3-5 3V1z" fill="currentColor" />
        </svg>
      </div>
      {transfer ? (
        <span className="mt-1 text-[10px] font-medium text-[#5099fe]">转</span>
      ) : (
        <span className="mt-1 h-3" aria-hidden />
      )}
    </div>
  );
}

function Badge({ label, tone }: { label: string; tone: "green" | "orange" }) {
  const styles =
    tone === "green"
      ? "bg-[#e8f7ef] text-[#16a34a]"
      : "bg-[#fff3e6] text-[#f97316]";
  return (
    <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-medium ${styles}`}>
      {label}
    </span>
  );
}

export function FlightSegmentCard({
  segment,
  variant = "direct",
  onClick,
}: FlightSegmentCardProps) {
  const isDirectLowest = variant === "direct-lowest";
  const isTransferLowest = variant === "transfer-lowest";
  const isTransfer = variant === "transfer" || isTransferLowest;
  const priceColor = isDirectLowest ? "text-[#16a34a]" : "text-[#de6f00]";
  const planeLabel = segment.PlaneTypeDescribe || segment.PlaneType || "";

  const topGradient = isDirectLowest
    ? "bg-gradient-to-b from-[#eefbf3] to-white"
    : isTransferLowest
      ? "bg-gradient-to-b from-[#fff7ed] to-white"
      : "bg-white";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full overflow-hidden rounded-xl text-left shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition active:scale-[0.99] ${topGradient}`}
    >
      {(isDirectLowest || isTransferLowest) && (
        <div className="px-3 pt-2.5">
          <Badge
            label={isDirectLowest ? "直飞低价" : "中转低价"}
            tone={isDirectLowest ? "green" : "orange"}
          />
        </div>
      )}

      <div className={`px-3 ${isDirectLowest || isTransferLowest ? "pb-3 pt-2" : "py-3"}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-start justify-between gap-1">
            <div className="min-w-0">
              <p className="text-[22px] font-semibold leading-none text-[#1a1a1a]">
                {formatFlightTime(segment.TakeoffTime)}
              </p>
              <p className="mt-1.5 truncate text-xs text-[#666666]">
                {shortAirportName(segment.FromAirportName ?? segment.FromCityName)}
                {segment.FromTerminal ? ` ${segment.FromTerminal}` : ""}
              </p>
            </div>

            <FlightRouteArrow transfer={isTransfer} />

            <div className="min-w-0 text-right">
              <p className="text-[22px] font-semibold leading-none text-[#1a1a1a]">
                {formatFlightTime(segment.ArrivalTime)}
              </p>
              <p className="mt-1.5 truncate text-xs text-[#666666]">
                {shortAirportName(segment.ToAirportName ?? segment.ToCityName)}
                {segment.ToTerminal ? ` ${segment.ToTerminal}` : ""}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end pl-1">
            {shouldShowScarceBadge(segment) ? (
              <span className="mb-0.5 rounded border border-[#ff4d4f] px-1 text-[10px] text-[#ff4d4f]">
                剩{segment.RemainSeats}张
              </span>
            ) : null}
            <p className={`text-xl font-bold leading-none ${priceColor}`}>
              <span className="text-xs font-semibold">¥</span>
              {segment.LowestFare ?? "-"}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#999999]">
          {segment.AirlineSrc ? (
            <img
              src={segment.AirlineSrc}
              alt=""
              className="size-4 shrink-0 object-contain"
            />
          ) : (
            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#eef3ff] text-[8px] font-bold text-[#5099fe]">
              {(segment.Airline ?? segment.AirlineName ?? "航").slice(0, 1)}
            </span>
          )}
          <span className="truncate">
            {segment.AirlineName}
            {segment.Number}
            {planeLabel ? ` ${planeLabel}` : ""}
          </span>
        </div>
      </div>
    </button>
  );
}
