import { useState } from "react";

import type { FlightBookSelection } from "@/lib/flight-book-session";
import { SummaryCollapseButton } from "@/components/book/SummaryCollapseButton";
import { FlightTransferRouteCard } from "@/components/flight/FlightTransferRouteCard";
import summaryRouteArrow from "@/assets/flight/summary-route-arrow.png";
import { formatFlightBookDuration, formatFlightBookRouteSubtitle } from "@/lib/flight-book-display";
import { buildFlightTransferItinerary } from "@/lib/flight-detail";
import { FlightRoutePlaneIcon } from "@/components/flight/FlightRoutePlaneIcon";
import { formatFlightTime } from "@/utils/flight-list";
import {
  shortAirlineName,
  shortAirportName,
} from "@/utils/flight-list-display";

const SUMMARY_FONT = "[font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]";

interface FlightBookSummaryProps {
  selection: FlightBookSelection;
  onShowRules: () => void;
}

export function FlightBookSummary({ selection, onShowRules }: FlightBookSummaryProps) {
  const [expanded, setExpanded] = useState(true);
  const { cabinsQuery, segment } = selection;
  const transferItinerary = buildFlightTransferItinerary(selection.detailSnapshot?.FlightSegments);
  const subtitle = formatFlightBookRouteSubtitle(
    segment.TakeoffTime || cabinsQuery.takeoffTime,
    segment.FlyTimeName || cabinsQuery.flyTimeName,
  );
  const durationLabel = formatFlightBookDuration(segment.FlyTimeName || cabinsQuery.flyTimeName);
  const flightNumber = segment.Number || segment.FlightNumber || cabinsQuery.flightNumber;
  const airlineName = shortAirlineName(segment.AirlineName || cabinsQuery.airlineName);
  const planeLabel = segment.PlaneType?.trim() || "";
  const fromAirport = shortAirportName(segment.FromAirportName || cabinsQuery.fromAirportName);
  const toAirport = shortAirportName(segment.ToAirportName || cabinsQuery.toAirportName);
  const airlineFlightLabel = [airlineName, flightNumber].filter(Boolean).join("");
  const airlineMetaLabel = [airlineFlightLabel, planeLabel].filter(Boolean).join(" ");
  const detailLabel = transferItinerary ? "行程详情" : "航班详情";

  return (
    <div className="px-3 pb-3 pt-2">
      <div className="rounded-lg bg-[linear-gradient(270deg,#2768FA_0%,#33A1F9_100%)] px-3.5 pb-3 pt-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div
              className={`flex items-center gap-2 text-[17px] font-medium leading-none tracking-normal text-white ${SUMMARY_FONT}`}
            >
              <span>{cabinsQuery.fromName}</span>
              <img
                src={summaryRouteArrow}
                alt=""
                width={20}
                height={17}
                className="h-[17px] w-5 shrink-0 object-contain"
                aria-hidden
              />
              <span>{cabinsQuery.toName}</span>
            </div>
            {subtitle ? (
              <p
                className={`mt-3 text-[14px] font-normal leading-none tracking-normal text-white ${SUMMARY_FONT}`}
              >
                {subtitle}
              </p>
            ) : null}
          </div>
          <SummaryCollapseButton
            expanded={expanded}
            detailLabel={detailLabel}
            onToggle={() => setExpanded((value) => !value)}
          />
        </div>

        {transferItinerary ? (
          <FlightTransferRouteCard
            itinerary={transferItinerary}
            expanded={expanded}
            durationLabel={durationLabel}
          />
        ) : expanded ? (
          <div className="mt-3 rounded-[8px] bg-[#FFFFFF] px-3 py-2">
            <div className="grid grid-cols-[minmax(0,1fr)_7.5rem_minmax(0,1fr)] items-start gap-x-2">
              <div className="min-w-0">
                <p className="text-[22px] font-semibold leading-none tracking-tight text-[#1a1a1a]">
                  {formatFlightTime(segment.TakeoffTime)}
                </p>
                <p className="mt-1.5 truncate text-[14px] text-[#666666]">{fromAirport}</p>
              </div>

              <div className="pt-0.5 text-center">
                {durationLabel ? (
                  <p className="text-[12px] leading-none text-[#999999]">{durationLabel}</p>
                ) : null}
                <div className="mt-1 flex items-center">
                  <div className="h-px flex-1 bg-[#d8e7ff]" />
                  <FlightRoutePlaneIcon className="mx-1 h-4 w-5 shrink-0" />
                  <div className="h-px flex-1 bg-[#d8e7ff]" />
                </div>
                {flightNumber ? (
                  <p className="mt-1 text-[12px] leading-none text-[#666666]">{flightNumber}</p>
                ) : null}
              </div>

              <div className="min-w-0 text-right">
                <p className="text-[22px] font-semibold leading-none tracking-tight text-[#1a1a1a]">
                  {formatFlightTime(segment.ArrivalTime)}
                </p>
                <p className="mt-1.5 truncate text-[14px] text-[#666666]">{toAirport}</p>
              </div>
            </div>

            {airlineMetaLabel ? (
              <div className="mt-2 flex min-w-0 items-center gap-2 text-[12px] text-[#666666]">
                {segment.AirlineSrc ? (
                  <img src={segment.AirlineSrc} alt="" className="size-4 shrink-0 object-contain" />
                ) : (
                  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#fff0f0] text-[9px] font-bold text-[#e64545]">
                    {(segment.Airline ?? airlineName ?? "航").slice(0, 1)}
                  </span>
                )}
                <p className="min-w-0 truncate">{airlineMetaLabel}</p>
              </div>
            ) : null}
          </div>
        ) : null}

        <button
          type="button"
          className={`mt-2 text-[11px] font-normal leading-none tracking-normal text-white active:opacity-80 ${SUMMARY_FONT}`}
          onClick={onShowRules}
        >
          预订须知和退改签说明&gt;
        </button>
      </div>
    </div>
  );
}
