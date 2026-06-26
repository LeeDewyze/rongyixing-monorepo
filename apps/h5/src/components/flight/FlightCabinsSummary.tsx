import type { FlightSegment } from "@ryx/shared-types";

import { FlightRoutePlaneIcon } from "@/components/flight/FlightRoutePlaneIcon";
import { FLIGHT_CABINS_FONT } from "@/components/flight/flight-cabins-chrome";
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

function AirlineLogo({ segment }: { segment: FlightSegment }) {
  if (segment.AirlineSrc) {
    return <img src={segment.AirlineSrc} alt="" className="size-[18px] shrink-0 object-contain" />;
  }

  return (
    <span className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-[#EEF4FF] text-[9px] font-bold text-[#2768FA]">
      {(segment.Airline ?? segment.AirlineName ?? "航").slice(0, 1)}
    </span>
  );
}

function MetaChip({
  children,
  variant = "default",
}: {
  children: string;
  variant?: "default" | "accent";
}) {
  const className =
    variant === "accent"
      ? "bg-[#EEF4FF] text-[#2768FA] ring-[#D6E4FF]"
      : "bg-[#F5F6F9] text-[#666666] ring-[#ECEEF2]";

  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full px-2 py-0.5 text-[11px] leading-none ring-1 ${className}`}
    >
      <span className="truncate">{children}</span>
    </span>
  );
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
  const airlineName = segment.AirlineName?.trim() ?? "";
  const flightNo = (segment.Number ?? segment.FlightNumber ?? "").trim();
  const flightTitle = [airlineName, flightNo].filter(Boolean).join(" ");

  const metaChips = [planeLabel, durationLabel, mealLabel].filter((value): value is string =>
    Boolean(value),
  );

  return (
    <div
      className={`overflow-hidden rounded-xl bg-white/95 px-4 py-4 shadow-[0_2px_12px_rgba(39,104,250,0.08)] ring-1 ring-white/80 backdrop-blur-[2px] ${FLIGHT_CABINS_FONT}`}
    >
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

      {flightTitle || metaChips.length > 0 ? (
        <div className="mt-4 border-t border-[#EEF1F6] pt-3">
          {flightTitle ? (
            <div className="flex min-w-0 items-center gap-2">
              <AirlineLogo segment={segment} />
              <p className="min-w-0 flex-1 truncate text-[13px] font-medium leading-snug text-[#333333]">
                {flightTitle}
              </p>
            </div>
          ) : null}

          {metaChips.length > 0 ? (
            <div
              className={`flex flex-wrap items-center gap-1.5 ${flightTitle ? "mt-2 pl-[26px]" : ""}`}
            >
              {planeLabel ? <MetaChip>{planeLabel}</MetaChip> : null}
              {durationLabel ? <MetaChip>{durationLabel}</MetaChip> : null}
              {mealLabel ? <MetaChip variant="accent">{mealLabel}</MetaChip> : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
