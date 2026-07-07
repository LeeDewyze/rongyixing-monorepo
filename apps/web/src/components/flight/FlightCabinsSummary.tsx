import type { FlightSegment } from "@ryx/shared-types";

import { FLIGHT_CABINS_FONT } from "@/components/flight/flight-cabins-chrome";
import summaryRouteArrow from "@/assets/flight/summary-route-arrow.png";
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
    <div className={`px-3 pb-3 pt-2 ${FLIGHT_CABINS_FONT}`}>
      <div
        className="rounded-lg px-3.5 pb-3 pt-3"
        style={{ background: "linear-gradient(270deg, #2768FA 0%, #33A1F9 100%)" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 text-white">
            <div className="flex min-w-0 items-center gap-2">
              <AirlineLogo segment={segment} />
              <p className="min-w-0 flex-1 truncate text-[17px] font-medium leading-none">
                {flightTitle || "航班详情"}
              </p>
            </div>
            <p className="mt-3 truncate text-[14px] font-normal leading-none text-white">
              {[planeLabel, mealLabel].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>

        <div className="mt-3 h-16 rounded-[8px] bg-white px-3">
          <div className="grid h-full grid-cols-[minmax(0,1fr)_7.5rem_minmax(0,1fr)] items-center gap-x-2">
            <div className="min-w-0">
              <p className="text-[16px] font-medium leading-none tabular-nums text-[#010101]">
                {formatFlightTime(segment.TakeoffTime)}
              </p>
              <p className="mt-1 truncate text-[14px] font-normal leading-none text-[#666666]">
                {fromLabel}
              </p>
            </div>

            <div className="text-center">
              {durationLabel ? (
                <p className="text-[12px] leading-none text-[#999999]">{durationLabel}</p>
              ) : null}
              <div className="mt-1 flex items-center justify-center">
                <img
                  src={summaryRouteArrow}
                  alt=""
                  width={56}
                  height={12}
                  className="h-3 w-14 shrink-0 object-contain"
                  aria-hidden
                />
              </div>
              {flightNo ? (
                <p className="mt-1 truncate text-[11px] font-normal leading-none text-[#666666]">
                  {flightNo}
                </p>
              ) : null}
            </div>

            <div className="relative min-w-0 text-right">
              {arrivalDateBadge ? (
                <p className="absolute -top-4 right-0 whitespace-nowrap text-[11px] font-medium leading-none text-[#ff8d1a]">
                  {arrivalDateBadge}
                </p>
              ) : null}
              <p className="text-[16px] font-medium leading-none tabular-nums text-[#010101]">
                {formatFlightTime(segment.ArrivalTime)}
              </p>
              <p className="mt-1 truncate text-[14px] font-normal leading-none text-[#666666]">
                {toLabel}
              </p>
            </div>
          </div>
        </div>

        {metaChips.length > 0 ? (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {durationLabel ? <MetaChip>{durationLabel}</MetaChip> : null}
            {planeLabel ? <MetaChip>{planeLabel}</MetaChip> : null}
            {mealLabel ? <MetaChip variant="accent">{mealLabel}</MetaChip> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
