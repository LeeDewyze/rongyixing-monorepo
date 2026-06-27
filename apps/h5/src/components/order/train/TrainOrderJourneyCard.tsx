import type { TrainOrderTicket, TrainOrderTrip } from "@ryx/shared-types";

import trainRouteArrow from "@/assets/train/route-arrow.png";
import orderRouteArrowIcon from "@/assets/flight/order-route-arrow.svg";
import {
  HOTEL_DETAIL_FONT,
  HOTEL_ORDER_LINK_ACTION,
  HOTEL_ORDER_SECTION_TITLE,
} from "@/components/hotel/hotel-detail-chrome";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { TrainSeatChairIcon } from "@/components/train/TrainSeatChairIcon";
import {
  formatTrainOrderSeatAssignment,
  formatTrainOrderSeatTypeLabel,
  resolveTrainOrderSeatLetter,
} from "@/lib/train-order-seat";
import { formatTrainOrderTripDuration } from "@/lib/train-order-detail";
import { formatTrainClock } from "@/utils/train-list";

interface TrainOrderJourneyCardProps {
  ticket: TrainOrderTicket;
  onShowExplain?: () => void;
  onShowSchedule?: () => void;
}

const TRIP_CARD_CLASS =
  "overflow-hidden rounded-xl bg-gradient-to-b from-[#FAFBFF] to-[#F4F7FC] shadow-[0_2px_12px_rgba(39,104,250,0.06)] ring-1 ring-[#E8EDF5]";

function formatTripDateLine(trip?: TrainOrderTrip): string {
  if (!trip?.StartTime) return "—";
  const datePart = trip.StartTime.slice(0, 10);
  const timePart = formatTrainClock(trip.StartTime);
  const trainCode = trip.TrainCode ?? "";
  return [datePart, timePart, trainCode].filter(Boolean).join(" ");
}

function RouteTitle({ fromStation, toStation }: { fromStation?: string; toStation?: string }) {
  if (!fromStation || !toStation) {
    return <h2 className={HOTEL_ORDER_SECTION_TITLE}>车次信息</h2>;
  }

  return (
    <h2 className={`${HOTEL_ORDER_SECTION_TITLE} flex min-w-0 items-center gap-1.5`}>
      <span className="truncate">{fromStation}</span>
      <img
        src={orderRouteArrowIcon}
        alt=""
        width={18}
        height={6}
        className="h-[6px] w-[18px] shrink-0"
        aria-hidden
      />
      <span className="truncate">{toStation}</span>
    </h2>
  );
}

function TripTimeline({ trip }: { trip: TrainOrderTrip }) {
  const durationLabel = formatTrainOrderTripDuration(trip);
  const trainCode = trip.TrainCode ?? "";

  return (
    <div className={TRIP_CARD_CLASS}>
      <div className="px-4 py-4">
        <div className="grid grid-cols-[minmax(0,1fr)_6.5rem_minmax(0,1fr)] items-start gap-x-2">
          <div className="min-w-0">
            <p className="text-[24px] font-semibold leading-none tracking-tight tabular-nums text-[#1a1a1a]">
              {formatTrainClock(trip.StartTime ?? "")}
            </p>
            <p className="mt-2 text-[13px] leading-snug text-[#666666]">{trip.FromStationName}</p>
          </div>

          <div className="pt-1 text-center">
            {durationLabel ? (
              <p className="text-[12px] leading-none text-[#999999]">{durationLabel}</p>
            ) : null}
            <div className={`flex items-center justify-center ${durationLabel ? "mt-1.5" : ""}`}>
              <img
                src={trainRouteArrow}
                alt=""
                width={56}
                height={12}
                className="h-3 w-14 object-contain"
                aria-hidden
              />
            </div>
            {trainCode ? (
              <span className="mt-1.5 inline-flex max-w-full items-center rounded-full bg-[#EEF4FF] px-2 py-0.5 text-[11px] font-medium leading-none text-[#2768FA] ring-1 ring-[#D6E4FF]">
                <span className="truncate">{trainCode}</span>
              </span>
            ) : null}
          </div>

          <div className="min-w-0 text-right">
            <p className="text-[24px] font-semibold leading-none tracking-tight tabular-nums text-[#1a1a1a]">
              {formatTrainClock(trip.ArrivalTime ?? "")}
            </p>
            <p className="mt-2 text-[13px] leading-snug text-[#666666]">{trip.ToStationName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SeatInfoRow({ trip, ticket }: { trip?: TrainOrderTrip; ticket: TrainOrderTicket }) {
  const seatSource = { trip, ticket };
  const seatTypeLabel = formatTrainOrderSeatTypeLabel(seatSource);
  const seatLetter = resolveTrainOrderSeatLetter(seatSource);

  return (
    <div className="mt-3 flex items-center justify-between gap-4">
      <span className="shrink-0 text-[14px] font-normal leading-none text-[#999999]">座位信息</span>
      <span className="flex min-w-0 items-center justify-end gap-1.5">
        {seatLetter ? <TrainSeatChairIcon code={seatLetter} size="sm" variant="issued" /> : null}
        <span className="text-[14px] font-normal leading-none text-[#010101]">
          {seatTypeLabel ?? ""}
        </span>
      </span>
    </div>
  );
}

export function TrainOrderJourneyCard({
  ticket,
  onShowExplain,
  onShowSchedule,
}: TrainOrderJourneyCardProps) {
  const trip = ticket.Trips[0];
  const seatSource = { trip, ticket };
  const seatAssignment = formatTrainOrderSeatAssignment(seatSource);

  return (
    <section
      className={`overflow-hidden rounded-xl bg-white px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${HOTEL_DETAIL_FONT}`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <RouteTitle fromStation={trip?.FromStationName} toStation={trip?.ToStationName} />
        {ticket.StatusName ? <OrderStatusBadge label={ticket.StatusName} variant="ticket" /> : null}
      </div>

      <p className="mb-3 text-[14px] font-normal leading-none text-[#010101]">
        {formatTripDateLine(trip)}
      </p>

      {trip ? <TripTimeline trip={trip} /> : null}

      <SeatInfoRow trip={trip} ticket={ticket} />

      {seatAssignment ? (
        <p className="mt-1.5 text-right text-[12px] leading-none text-[#999999]">
          {seatAssignment}
        </p>
      ) : null}

      {ticket.FullTicketNo ? (
        <p className="mt-2 text-[12px] text-[#999999]">票号 {ticket.FullTicketNo}</p>
      ) : null}

      <div className="mt-3 flex items-center justify-end gap-3">
        {onShowSchedule ? (
          <button type="button" className={HOTEL_ORDER_LINK_ACTION} onClick={onShowSchedule}>
            经停站 ›
          </button>
        ) : null}
        {ticket.Explain || onShowExplain ? (
          <button type="button" className={HOTEL_ORDER_LINK_ACTION} onClick={onShowExplain}>
            退改签说明 ›
          </button>
        ) : null}
      </div>
    </section>
  );
}
