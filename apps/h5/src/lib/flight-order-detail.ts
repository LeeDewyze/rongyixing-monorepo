import type {
  FlightOrderTicket,
  HotelOrderActionFlags,
  HotelOrderBillLine,
  HotelOrderDetail,
} from "@ryx/shared-types";

import { FLIGHT_PAY_TYPE_CREDIT, FLIGHT_PAY_TYPE_PERSON } from "@/lib/flight-book-pay";

export type CoercedFlightOrderDetail = HotelOrderDetail & {
  Tickets: FlightOrderTicket[];
  BillItems: HotelOrderBillLine[];
  Actions: HotelOrderActionFlags;
};

const DEFAULT_FLIGHT_ACTIONS: HotelOrderActionFlags = {
  showPay: false,
  showCancel: false,
  smsAction: "none",
};

const TRANSITIONAL_TICKET_STATUSES = new Set([
  "Booking",
  "Booked",
  "Issuing",
  "BookExchanging",
  "BookExchanged",
  "Exchanging",
  "Abolishing",
  "ExchangeAbolishing",
]);

const TRANSITIONAL_ORDER_STATUSES = new Set(["Booking", "WaitHandle", "WaitPay"]);

export function coerceFlightOrderDetail(detail: HotelOrderDetail): CoercedFlightOrderDetail {
  return {
    ...detail,
    Tickets: (detail.Tickets ?? []) as FlightOrderTicket[],
    BillItems: detail.BillItems ?? [],
    Actions:
      detail.Actions ??
      ({
        ...DEFAULT_FLIGHT_ACTIONS,
        showPay: Boolean(detail.isShowPayButton),
      } satisfies HotelOrderActionFlags),
    ShowServiceFee: detail.ShowServiceFee ?? true,
  };
}

export function getSelectedTicket(
  detail: CoercedFlightOrderDetail,
  index: number,
): FlightOrderTicket | undefined {
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

export function sumBillLines(lines: HotelOrderBillLine[]): number {
  return lines.reduce((sum, item) => sum + item.Amount, 0);
}

export type FlightCancelTarget =
  | { mode: "order"; ticketId: string }
  | { mode: "ticket"; ticketId: string };

/** Pay-hold cancel only — refund uses `RefundFlight` on the order list. */
export function resolveCancelTarget(detail: CoercedFlightOrderDetail): FlightCancelTarget | null {
  const tickets = detail.Tickets;
  if (tickets.length === 0) return null;
  if (tickets.length > 1) {
    const last = tickets[tickets.length - 1];
    return last ? { mode: "ticket", ticketId: last.Id } : null;
  }
  const first = tickets[0];
  return first ? { mode: "order", ticketId: first.Id } : null;
}

export function isTransitionalFlightTicket(ticket: FlightOrderTicket): boolean {
  const status = ticket.Status?.trim();
  if (status && TRANSITIONAL_TICKET_STATUSES.has(status)) {
    return true;
  }
  const name = ticket.StatusName ?? "";
  return /预订中|出票中|改签|取消中/.test(name);
}

export function shouldPollFlightOrderDetail(detail?: HotelOrderDetail): boolean {
  if (!detail) return false;
  if (detail.Status && TRANSITIONAL_ORDER_STATUSES.has(detail.Status)) {
    return true;
  }
  return (detail.Tickets ?? []).some(isTransitionalFlightTicket);
}

export function shouldShowFlightFooter(
  actions: HotelOrderActionFlags,
  payHoldSecondsRemaining: number | null,
): boolean {
  if (payHoldSecondsRemaining == null || payHoldSecondsRemaining <= 0) {
    return false;
  }
  return actions.showPay || actions.showCancel;
}

export function formatPayHoldCountdownZh(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}分${String(seconds).padStart(2, "0")}秒`;
}

export function resolvePayHoldSeconds(payHoldMinutes?: number): number | null {
  if (typeof payHoldMinutes !== "number" || payHoldMinutes <= 0) return null;
  return Math.floor(payHoldMinutes * 60);
}

export function requiresPersonalPaymentCode(travelPayTypeCode?: number): boolean {
  return (
    travelPayTypeCode === FLIGHT_PAY_TYPE_PERSON || travelPayTypeCode === FLIGHT_PAY_TYPE_CREDIT
  );
}

export {
  formatOrderDateTime,
  formatTravelPayType,
  formatTravelerCredentialDisplay,
  formatApprovalExpiredTime,
} from "@/lib/hotel-order-detail";
