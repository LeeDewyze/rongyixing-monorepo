import type { FlightSegment } from "@ryx/shared-types";

import { FlightRoutePlaneIcon } from "@/components/flight/FlightRoutePlaneIcon";
import { formatFlightTime } from "@/utils/flight-list";
import {
  formatArrivalDateBadge,
  formatFlightLocationLabel,
  formatFlightMealLabel,
  formatFlightMetaDuration,
} from "@/utils/flight-list-display";

interface FlightCabinsSummaryProps {
  segment: FlightSegment;
}

function MetaDivider() {
  return <span className="text-[#dddddd]">|</span>;
}

export function FlightCabinsSummary({ segment }: FlightCabinsSummaryProps) {
  const arrivalDateBadge = formatArrivalDateBadge(segment.TakeoffTime, segment.ArrivalTime);
  const fromLabel = formatFlightLocationLabel(
    segment.FromCityName,
    segment.FromAirportName,
    segment.FromTerminal,
  );
  const toLabel = formatFlightLocationLabel(
    segment.ToCityName,
    segment.ToAirportName,
    segment.ToTerminal,
  );
  const planeLabel = segment.PlaneTypeDescribe || segment.PlaneType || "";
  const durationLabel = formatFlightMetaDuration(segment.FlyTimeName);
  const mealLabel = formatFlightMealLabel(segment.Meal);
  const flightNo = `${segment.AirlineName ?? ""}${segment.Number ?? segment.FlightNumber ?? ""}`;

  return (
    <div className="overflow-hidden rounded-xl bg-white px-4 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <div className="grid grid-cols-[minmax(0,1fr)_5.5rem_minmax(0,1fr)] items-center gap-x-3">
        <p className="text-[28px] font-semibold leading-none tracking-tight tabular-nums text-[#1a1a1a]">
          {formatFlightTime(segment.TakeoffTime)}
        </p>

        <div className="flex items-center">
          <div className="h-px flex-1 bg-[#5099fe]/30" />
          <FlightRoutePlaneIcon className="mx-1 h-4 w-5 shrink-0" />
          <div className="h-px flex-1 bg-[#5099fe]/30" />
        </div>

        <div className="relative min-w-0 text-right">
          {arrivalDateBadge ? (
            <p className="absolute -top-4 right-0 whitespace-nowrap text-[11px] font-medium leading-none text-[#ff8d1a]">
              {arrivalDateBadge}
            </p>
          ) : null}
          <p className="text-[28px] font-semibold leading-none tracking-tight tabular-nums text-[#1a1a1a]">
            {formatFlightTime(segment.ArrivalTime)}
          </p>
        </div>

        <p className="mt-2 text-[13px] leading-snug text-[#666666]">{fromLabel}</p>
        <div aria-hidden />
        <p className="mt-2 text-right text-[13px] leading-snug text-[#666666]">{toLabel}</p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12px] text-[#999999]">
        {segment.AirlineSrc ? (
          <img src={segment.AirlineSrc} alt="" className="size-4 shrink-0 object-contain" />
        ) : (
          <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#eef3ff] text-[8px] font-bold text-[#5099fe]">
            {(segment.Airline ?? segment.AirlineName ?? "航").slice(0, 1)}
          </span>
        )}
        {flightNo ? <span>{flightNo}</span> : null}
        {planeLabel ? (
          <>
            <MetaDivider />
            <span>{planeLabel}</span>
          </>
        ) : null}
        {durationLabel ? (
          <>
            <MetaDivider />
            <span>{durationLabel}</span>
          </>
        ) : null}
        {mealLabel ? (
          <>
            <MetaDivider />
            <span className="text-[#5099fe]">{mealLabel}</span>
          </>
        ) : null}
      </div>
    </div>
  );
}
