import { useState } from "react";

import type { FlightSegment } from "@ryx/shared-types";

import { SummaryCollapseButton } from "@/components/book/SummaryCollapseButton";
import { FLIGHT_CABINS_FONT } from "@/components/flight/flight-cabins-chrome";
import {
  FlightTransferRouteCard,
  TransferAirlineLogo,
  TransferRouteSummaryRow,
} from "@/components/flight/FlightTransferRouteCard";
import { buildFlightTransferItinerary } from "@/lib/flight-detail";
import {
  formatArrivalDateBadge,
  formatFlightLocationLabel,
  formatFlightMealLabel,
  formatFlightMetaDuration,
} from "@/utils/flight-list-display";

interface FlightCabinsSummaryProps {
  segment: FlightSegment;
  detailSegments?: FlightSegment[];
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

export function FlightCabinsSummary({ segment, detailSegments }: FlightCabinsSummaryProps) {
  const [transferExpanded, setTransferExpanded] = useState(true);
  const transferItinerary = buildFlightTransferItinerary(detailSegments);
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
  const headerTitle = transferItinerary
    ? [segment.FromCityName, segment.ToCityName].filter(Boolean).join(" — ") || "中转行程"
    : [airlineName, flightNo].filter(Boolean).join(" ");
  const headerSubtitle = transferItinerary
    ? undefined
    : [planeLabel, mealLabel].filter(Boolean).join(" · ");

  const metaChips = [planeLabel, durationLabel, mealLabel].filter((value): value is string =>
    Boolean(value),
  );

  const metaChipRow =
    metaChips.length > 0 ? (
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {durationLabel ? <MetaChip>{durationLabel}</MetaChip> : null}
        {planeLabel ? <MetaChip>{planeLabel}</MetaChip> : null}
        {mealLabel ? <MetaChip variant="accent">{mealLabel}</MetaChip> : null}
      </div>
    ) : null;

  return (
    <div className={`px-3 pb-3 pt-2 ${FLIGHT_CABINS_FONT}`}>
      <div
        className="rounded-lg px-3.5 pb-3 pt-3"
        style={{ background: "linear-gradient(270deg, #2768FA 0%, #33A1F9 100%)" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 text-white">
            <div className="flex min-w-0 items-center gap-2">
              <TransferAirlineLogo segment={segment} />
              <p className="min-w-0 flex-1 truncate text-[17px] font-medium leading-none">
                {headerTitle || "航班详情"}
              </p>
            </div>
            {headerSubtitle ? (
              <p className="mt-3 truncate text-[14px] font-normal leading-none text-white">
                {headerSubtitle}
              </p>
            ) : null}
          </div>
          {transferItinerary ? (
            <SummaryCollapseButton
              expanded={transferExpanded}
              detailLabel="行程详情"
              onToggle={() => setTransferExpanded((value) => !value)}
            />
          ) : null}
        </div>

        {transferItinerary ? (
          <>
            <FlightTransferRouteCard
              itinerary={transferItinerary}
              expanded={transferExpanded}
              durationLabel={durationLabel}
            />
            {metaChipRow}
          </>
        ) : (
          <>
            <div className="mt-3 min-h-16 rounded-[8px] bg-white px-3 py-3">
              <TransferRouteSummaryRow
                takeoffTime={segment.TakeoffTime}
                arrivalTime={segment.ArrivalTime}
                fromLabel={fromLabel}
                toLabel={toLabel}
                durationLabel={durationLabel}
                flightNo={flightNo}
                arrivalDayTip={arrivalDateBadge}
              />
            </div>
            {metaChipRow}
          </>
        )}
      </div>
    </div>
  );
}
