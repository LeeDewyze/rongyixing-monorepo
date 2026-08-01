import { useState } from "react";

import type { FlightSegment } from "@ryx/shared-types";

import { SummaryCollapseButton } from "@/components/book/SummaryCollapseButton";
import { FLIGHT_CABINS_FONT } from "@/components/flight/flight-cabins-chrome";
import summaryRouteArrow from "@/assets/flight/summary-route-arrow.png";
import {
  buildFlightTransferItinerary,
  formatFlightTransferLayoverSummary,
  type FlightTransferItinerary,
  type FlightTransferLegView,
  type FlightTransferLayover,
} from "@/lib/flight-detail";
import { formatFlightTime } from "@/utils/flight-list";
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

function RouteSummaryRow({
  takeoffTime,
  arrivalTime,
  fromLabel,
  toLabel,
  durationLabel,
  flightNo,
  routeMiddleLabel,
  routeMiddleSubLabel,
  departureDayTip,
  arrivalDayTip,
}: {
  takeoffTime?: string;
  arrivalTime?: string;
  fromLabel: string;
  toLabel: string;
  durationLabel?: string;
  flightNo?: string;
  routeMiddleLabel?: string;
  routeMiddleSubLabel?: string;
  departureDayTip?: string;
  arrivalDayTip?: string;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_7.5rem_minmax(0,1fr)] items-start gap-x-2">
      <div className="min-w-0">
        {departureDayTip ? (
          <p className="mb-1 whitespace-nowrap text-[11px] font-medium leading-none text-[#ff8d1a]">
            {departureDayTip}
          </p>
        ) : null}
        <p className="text-[16px] font-medium leading-none tabular-nums text-[#010101]">
          {formatFlightTime(takeoffTime)}
        </p>
        <p className="mt-1 truncate text-[14px] font-normal leading-none text-[#666666]">
          {fromLabel}
        </p>
      </div>

      <div className="pt-1 text-center">
        {durationLabel ? (
          <p className="text-[12px] leading-none text-[#999999]">{durationLabel}</p>
        ) : null}
        <div
          className={
            durationLabel
              ? "mt-1 flex items-center justify-center"
              : "flex items-center justify-center"
          }
        >
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
        ) : routeMiddleLabel ? (
          <p className="mt-1 flex min-w-0 flex-col items-center justify-center gap-0.5 text-center leading-tight">
            <span className="max-w-full break-words text-[11px] font-medium text-[#2768FA]">
              {routeMiddleLabel}
            </span>
            {routeMiddleSubLabel ? (
              <span className="max-w-full break-words text-[11px] font-normal text-[#999999]">
                {routeMiddleSubLabel}
              </span>
            ) : null}
          </p>
        ) : null}
      </div>

      <div className="min-w-0 text-right">
        {arrivalDayTip ? (
          <p className="mb-1 whitespace-nowrap text-[11px] font-medium leading-none text-[#ff8d1a]">
            {arrivalDayTip}
          </p>
        ) : null}
        <p className="text-[16px] font-medium leading-none tabular-nums text-[#010101]">
          {formatFlightTime(arrivalTime)}
        </p>
        <p className="mt-1 truncate text-[14px] font-normal leading-none text-[#666666]">
          {toLabel}
        </p>
      </div>
    </div>
  );
}

function TransferLayoverRow({ layover }: { layover: FlightTransferLayover }) {
  const title = layover.waitDurationLabel
    ? `中转 · ${layover.cityLabel} ${layover.waitDurationLabel}`
    : `中转 · ${layover.cityLabel}`;

  return (
    <div className="border-y border-dashed border-[#E8EDF5] py-2.5 text-center">
      <p className="text-[11px] font-medium leading-none text-[#2768FA]">{title}</p>
      {layover.airportLabel ? (
        <p className="mt-1 truncate text-[10px] leading-none text-[#999999]">
          {layover.airportLabel}
        </p>
      ) : null}
    </div>
  );
}

function TransferLegBlock({ leg }: { leg: FlightTransferLegView }) {
  const metaParts = [leg.planeLabel, leg.mealLabel].filter(Boolean);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <AirlineLogo segment={leg.segment} />
        <p className="min-w-0 truncate text-[13px] font-medium leading-none text-[#010101]">
          {[leg.segment.AirlineName, leg.flightNo].filter(Boolean).join(" ")}
        </p>
      </div>
      <RouteSummaryRow
        takeoffTime={leg.segment.TakeoffTime}
        arrivalTime={leg.segment.ArrivalTime}
        fromLabel={leg.fromLabel}
        toLabel={leg.toLabel}
        durationLabel={leg.durationLabel}
        flightNo={leg.flightNo}
        departureDayTip={leg.departureDayTip}
        arrivalDayTip={leg.arrivalDayTip}
      />
      {metaParts.length > 0 ? (
        <p className="truncate text-[11px] leading-none text-[#999999]">{metaParts.join(" · ")}</p>
      ) : null}
    </div>
  );
}

function TransferRouteCard({
  itinerary,
  expanded,
  durationLabel,
}: {
  itinerary: FlightTransferItinerary;
  expanded: boolean;
  durationLabel?: string;
}) {
  const firstLeg = itinerary.legs[0]!;
  const lastLeg = itinerary.legs[itinerary.legs.length - 1]!;
  const collapsedTransferMiddle = formatFlightTransferLayoverSummary(itinerary.layovers);

  return (
    <div className="mt-3 rounded-[8px] bg-white px-3 py-3">
      {expanded ? (
        <div className="space-y-3">
          {itinerary.legs.map((leg, index) => (
            <div key={`${leg.flightNo}-${leg.segment.TakeoffTime ?? index}`}>
              <TransferLegBlock leg={leg} />
              {itinerary.layovers[index] ? (
                <div className="mt-3">
                  <TransferLayoverRow layover={itinerary.layovers[index]!} />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <RouteSummaryRow
          takeoffTime={firstLeg.segment.TakeoffTime}
          arrivalTime={lastLeg.segment.ArrivalTime}
          fromLabel={firstLeg.fromLabel}
          toLabel={lastLeg.toLabel}
          durationLabel={durationLabel}
          routeMiddleLabel={collapsedTransferMiddle.routeMiddleLabel}
          routeMiddleSubLabel={collapsedTransferMiddle.waitDurationLabel}
        />
      )}
    </div>
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
              <AirlineLogo segment={segment} />
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
            <TransferRouteCard
              itinerary={transferItinerary}
              expanded={transferExpanded}
              durationLabel={durationLabel}
            />
            {metaChipRow}
          </>
        ) : (
          <>
            <div className="mt-3 min-h-16 rounded-[8px] bg-white px-3 py-3">
              <RouteSummaryRow
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
