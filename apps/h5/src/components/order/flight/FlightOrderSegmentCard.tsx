import type { FlightOrderTicket, FlightOrderTrip } from "@ryx/shared-types";

import orderRouteArrowIcon from "@/assets/flight/order-route-arrow.svg";
import { FlightRoutePlaneIcon } from "@/components/flight/FlightRoutePlaneIcon";
import {
  HOTEL_DETAIL_FONT,
  HOTEL_ORDER_SECTION_TITLE,
} from "@/components/hotel/hotel-detail-chrome";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { formatFlightBookRouteSubtitle, formatFlightBookDuration } from "@/lib/flight-book-display";
import { formatFlightTime } from "@/utils/flight-list";
import {
  formatArrivalDateBadge,
  formatFlightListPlaneLabel,
  formatFlightLocationLabel,
  formatOrderTripAirlineFlightLabel,
} from "@/utils/flight-list-display";

interface FlightOrderSegmentCardProps {
  ticket: FlightOrderTicket;
  onShowExplain?: () => void;
}

const ORDER_SEGMENT_DATE_LINE = `${HOTEL_DETAIL_FONT} text-[14px] font-normal leading-none tracking-normal text-[#010101]`;

function formatTripDateLine(trip?: FlightOrderTrip): string {
  if (!trip?.TakeoffTime) return "—";
  return formatFlightBookRouteSubtitle(trip.TakeoffTime, trip.FlyTime) || "—";
}

const TRIP_CARD_CLASS =
  "overflow-hidden rounded-xl bg-gradient-to-b from-[#FAFBFF] to-[#F4F7FC] shadow-[0_2px_12px_rgba(39,104,250,0.06)] ring-1 ring-[#E8EDF5]";

function AirlineLogo({ trip }: { trip: FlightOrderTrip }) {
  if (trip.AirlineSrc) {
    return <img src={trip.AirlineSrc} alt="" className="size-[18px] shrink-0 object-contain" />;
  }

  return (
    <span className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-[#EEF4FF] text-[9px] font-bold text-[#2768FA]">
      {(trip.Airline ?? trip.AirlineName ?? "航").slice(0, 1)}
    </span>
  );
}

function TripMetaFooter({ trip }: { trip: FlightOrderTrip }) {
  const airlineFlightLabel = formatOrderTripAirlineFlightLabel(trip);
  const planeLabel = formatFlightListPlaneLabel(trip.PlaneTypeDescribe, trip.PlaneType);

  if (!trip.AirlineSrc && !airlineFlightLabel && !planeLabel) {
    return null;
  }

  return (
    <div className="flex items-center bg-[#F5F7FA] px-3.5 py-3">
      <AirlineLogo trip={trip} />
      {airlineFlightLabel ? (
        <span className="ml-2 shrink-0 text-[12px] font-normal leading-none text-[#666666]">
          {airlineFlightLabel}
        </span>
      ) : null}
      {planeLabel ? (
        <span className="ml-5 shrink-0 text-[12px] font-normal leading-none text-[#666666]">
          {planeLabel}
        </span>
      ) : null}
    </div>
  );
}

function TripTimeline({ trip }: { trip: FlightOrderTrip }) {
  const fromLabel = formatFlightLocationLabel(
    trip.FromCityName,
    trip.FromAirportName,
    trip.FromTerminal,
  );
  const toLabel = formatFlightLocationLabel(trip.ToCityName, trip.ToAirportName, trip.ToTerminal);
  const flightNo = trip.FlightNumber ?? "";
  const durationLabel = formatFlightBookDuration(trip.FlyTime);
  const arrivalDayTip = formatArrivalDateBadge(trip.TakeoffTime, trip.ArrivalTime);

  return (
    <div className={TRIP_CARD_CLASS}>
      <div className="px-4 py-4">
        <div className="grid grid-cols-[minmax(0,1fr)_6.5rem_minmax(0,1fr)] items-start gap-x-2">
          <div className="min-w-0">
            <p className="text-[24px] font-semibold leading-none tracking-tight tabular-nums text-[#1a1a1a]">
              {formatFlightTime(trip.TakeoffTime)}
            </p>
            <p className="mt-2 text-[13px] leading-snug text-[#666666]">{fromLabel}</p>
          </div>

          <div className="pt-1 text-center">
            {durationLabel ? (
              <p className="text-[11px] leading-none text-[#999999]">{durationLabel}</p>
            ) : null}
            <div className={`flex items-center ${durationLabel ? "mt-1.5" : ""}`}>
              <div className="h-px flex-1 bg-[#5099fe]/25" />
              <FlightRoutePlaneIcon className="mx-1 h-4 w-5 shrink-0" />
              <div className="h-px flex-1 bg-[#5099fe]/25" />
            </div>
            {flightNo ? (
              <span className="mt-1.5 inline-flex max-w-full items-center rounded-full bg-[#EEF4FF] px-2 py-0.5 text-[11px] font-medium leading-none text-[#2768FA] ring-1 ring-[#D6E4FF]">
                <span className="truncate">{flightNo}</span>
              </span>
            ) : null}
          </div>

          <div className="min-w-0 text-right">
            <div className="relative inline-block max-w-full">
              {arrivalDayTip ? (
                <span className="absolute bottom-full right-0 mb-0.5 whitespace-nowrap text-[10px] font-medium leading-none text-[#FF8D1A]">
                  {arrivalDayTip}
                </span>
              ) : null}
              <p className="text-[24px] font-semibold leading-none tracking-tight tabular-nums text-[#1a1a1a]">
                {formatFlightTime(trip.ArrivalTime)}
              </p>
            </div>
            <p className="mt-2 text-[13px] leading-snug text-[#666666]">{toLabel}</p>
          </div>
        </div>
      </div>

      <TripMetaFooter trip={trip} />
    </div>
  );
}

function RouteTitle({ fromCity, toCity }: { fromCity?: string; toCity?: string }) {
  if (!fromCity || !toCity) {
    return <h2 className={HOTEL_ORDER_SECTION_TITLE}>航班信息</h2>;
  }

  return (
    <h2 className={`${HOTEL_ORDER_SECTION_TITLE} flex min-w-0 items-center gap-1.5`}>
      <span className="truncate">{fromCity}</span>
      <img
        src={orderRouteArrowIcon}
        alt=""
        width={18}
        height={6}
        className="h-[6px] w-[18px] shrink-0"
        aria-hidden
      />
      <span className="truncate">{toCity}</span>
    </h2>
  );
}

export function FlightOrderSegmentCard({ ticket, onShowExplain }: FlightOrderSegmentCardProps) {
  const trip = ticket.Trips[0];

  return (
    <section
      className={`overflow-hidden rounded-xl bg-white px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${HOTEL_DETAIL_FONT}`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <RouteTitle fromCity={trip?.FromCityName} toCity={trip?.ToCityName} />
        {ticket.StatusName ? <OrderStatusBadge label={ticket.StatusName} variant="ticket" /> : null}
      </div>

      <p className={`mb-3 ${ORDER_SEGMENT_DATE_LINE}`}>{formatTripDateLine(trip)}</p>

      {trip ? <TripTimeline trip={trip} /> : null}

      {ticket.FullTicketNo ? (
        <p className="mt-2 text-[12px] text-[#999999]">票号 {ticket.FullTicketNo}</p>
      ) : null}

      {ticket.Explain || onShowExplain ? (
        <button
          type="button"
          className="mt-3 text-[13px] font-medium text-[#2768FA]"
          onClick={onShowExplain}
        >
          退改签说明 ›
        </button>
      ) : null}
    </section>
  );
}
