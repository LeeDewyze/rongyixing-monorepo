import type {
  HotelOrderActionFlags,
  HotelOrderBillLine,
  HotelOrderDetail,
  TrainOrderTicket,
  TrainOrderTrip,
} from "@ryx/shared-types";

import { formatPayHoldCountdownZh } from "@/lib/flight-order-detail";
import { formatTrainDurationMinutes, parseDurationMinutes } from "@/utils/train-list";

/** Duration label above the route arrow on train order detail (e.g. 11时20分). */
export function formatTrainOrderTripDuration(trip?: TrainOrderTrip): string | null {
  if (!trip) return null;

  if (trip.RunTime != null && trip.RunTime !== "") {
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

const TRANSITIONAL_ORDER_STATUSES = new Set([
  "Booking",
  "WaitHandle",
  "WaitPay",
  "WaitIssue",
  "Abolishing",
  "Cancelling",
]);

/** Legacy `OrderTrainTicketStatusType` values that still need polling (public-order-train-detail). */
const TRANSITIONAL_TICKET_STATUS_CODES = new Set([
  "1", // Booking
  "3", // Issuing
  "5", // Refunding
  "7", // BookExchanging
  "9", // Exchanging
  "14", // Abolishing
  "17", // ExchangeAbolishing
]);

const TRANSITIONAL_TICKET_STATUS_NAMES = new Set([
  "Booking",
  "Issuing",
  "Refunding",
  "BookExchanging",
  "Exchanging",
  "Abolishing",
  "ExchangeAbolishing",
]);

const TRANSITIONAL_TICKET_STATUS_LABEL =
  /待出票|出票中|预订中|取消中|废除中|改签废除中|退票申请中|退票中|改签出票中|改签预订中|预订修改中/;

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
  const status = ticket.Status?.trim();
  if (status) {
    if (TRANSITIONAL_TICKET_STATUS_CODES.has(status)) {
      return true;
    }
    if (TRANSITIONAL_TICKET_STATUS_NAMES.has(status)) {
      return true;
    }
  }

  const labels = [ticket.AppStatusName, ticket.StatusName].filter(Boolean).join(" ");
  return TRANSITIONAL_TICKET_STATUS_LABEL.test(labels);
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

export function shouldShowTrainOrderHoldBanner(
  payHoldSecondsRemaining: number | null,
  actions?: HotelOrderActionFlags,
): boolean {
  if (payHoldSecondsRemaining == null || payHoldSecondsRemaining <= 0) {
    return false;
  }
  return Boolean(actions?.showPay || actions?.showCancel || actions?.showIssue);
}

export function formatTrainOrderHoldBannerMessage(
  payHoldSecondsRemaining: number,
  actions?: HotelOrderActionFlags,
): string {
  const time = formatPayHoldCountdownZh(payHoldSecondsRemaining);
  if (actions?.showIssue && !actions.showPay) {
    return `订单将在${time}后关闭`;
  }
  return `订单将在${time}后关闭，如需出行，请尽快提交`;
}

const PENDING_ISSUE_TICKET_STATUSES = new Set(["2", "8", "Booked", "BookExchanged"]);

export function resolveTrainTicketDisplayStatus(
  ticket: Pick<TrainOrderTicket, "AppStatusName" | "StatusName" | "Status">,
): string | undefined {
  const status = ticket.Status?.trim();
  if (status && PENDING_ISSUE_TICKET_STATUSES.has(status)) {
    return "待出票";
  }

  const statusName = ticket.StatusName?.trim();
  if (statusName) return statusName;

  return ticket.AppStatusName?.trim() || undefined;
}

export { mergeTrainFooterActions, resolveTrainCountdownLabel } from "@/lib/train-order-actions";

export {
  formatOrderDateTime,
  formatPayHoldCountdownZh,
  formatTravelPayType,
  resolvePayHoldSeconds,
  sumBillLines,
} from "@/lib/flight-order-detail";
