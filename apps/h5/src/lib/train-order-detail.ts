import type {
  HotelOrderActionFlags,
  HotelOrderBillLine,
  HotelOrderDetail,
  TrainOrderTicket,
  TrainOrderTrip,
} from "@ryx/shared-types";

import { formatTrainDurationMinutes, parseDurationMinutes } from "@/utils/train-list";

/** Duration label above the route arrow on train order detail (e.g. 11时20分). */
export function formatTrainOrderTripDuration(trip?: TrainOrderTrip): string | null {
  if (!trip) return null;

  if (trip.RunTime?.trim()) {
    const minutes = parseDurationMinutes(trip.RunTime);
    if (minutes > 0) {
      return formatTrainDurationMinutes(minutes);
    }
  }

  const start = trip.StartTime?.trim();
  const arrival = trip.ArrivalTime?.trim();
  if (!start || !arrival) return null;

  const startMs = Date.parse(start.includes("T") ? start : start.replace(" ", "T"));
  const arrivalMs = Date.parse(arrival.includes("T") ? arrival : arrival.replace(" ", "T"));
  if (!Number.isFinite(startMs) || !Number.isFinite(arrivalMs)) return null;

  const diffMinutes = Math.round((arrivalMs - startMs) / 60_000);
  return diffMinutes > 0 ? formatTrainDurationMinutes(diffMinutes) : null;
}

export type CoercedTrainOrderDetail = HotelOrderDetail & {
  Tickets: TrainOrderTicket[];
  BillItems: HotelOrderBillLine[];
  Actions: HotelOrderActionFlags;
};

const DEFAULT_TRAIN_ACTIONS: HotelOrderActionFlags = {
  showPay: false,
  showCancel: false,
  showIssue: false,
  smsAction: "none",
};

const TRANSITIONAL_ORDER_STATUSES = new Set(["Booking", "WaitHandle", "WaitPay", "WaitIssue"]);

export function coerceTrainOrderDetail(detail: HotelOrderDetail): CoercedTrainOrderDetail {
  return {
    ...detail,
    Tickets: (detail.Tickets ?? []) as TrainOrderTicket[],
    BillItems: detail.BillItems ?? [],
    Actions:
      detail.Actions ??
      ({
        ...DEFAULT_TRAIN_ACTIONS,
        showPay: Boolean(detail.isShowPayButton),
      } satisfies HotelOrderActionFlags),
    ShowServiceFee: detail.ShowServiceFee ?? true,
  };
}

export function getSelectedTicket(
  detail: CoercedTrainOrderDetail,
  index: number,
): TrainOrderTicket | undefined {
  return detail.Tickets[index];
}

export function filterBillLinesForTicket(
  items: HotelOrderBillLine[] | undefined,
  ticketKey: string,
  showServiceFee: boolean,
): HotelOrderBillLine[] {
  let lines = (items ?? []).filter((item) => item.Key === ticketKey);
  if (!showServiceFee) {
    lines = lines.filter((item) => !item.Tag?.endsWith("Fee"));
  }
  return lines;
}

export function isTransitionalTrainTicket(ticket: TrainOrderTicket): boolean {
  const name = ticket.StatusName ?? "";
  return /待出票|出票中|预订|取消中/.test(name);
}

export function shouldPollTrainOrderDetail(detail?: HotelOrderDetail): boolean {
  if (!detail || detail.ProductType !== "Train") {
    return false;
  }
  if (detail.Status && TRANSITIONAL_ORDER_STATUSES.has(detail.Status)) {
    return true;
  }
  return coerceTrainOrderDetail(detail).Tickets.some(isTransitionalTrainTicket);
}

export function shouldShowTrainFooter(
  actions: HotelOrderActionFlags,
  payHoldSecondsRemaining: number | null,
): boolean {
  if (actions.showRefund || actions.showExchange) {
    return true;
  }
  if (actions.showIssue) {
    return Boolean(actions.showCancel || actions.showIssue);
  }
  if (payHoldSecondsRemaining == null || payHoldSecondsRemaining <= 0) {
    return false;
  }
  return actions.showPay || actions.showCancel;
}

export { mergeTrainFooterActions, resolveTrainCountdownLabel } from "@/lib/train-order-actions";

export {
  formatOrderDateTime,
  formatPayHoldCountdownZh,
  formatTravelPayType,
  resolvePayHoldSeconds,
  sumBillLines,
} from "@/lib/flight-order-detail";
