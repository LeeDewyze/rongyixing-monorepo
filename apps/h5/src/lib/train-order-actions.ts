import type { HotelOrderActionFlags, TrainOrderTicket } from "@ryx/shared-types";
import { ProductType } from "@ryx/shared-types";

import { getApi } from "@/lib/api";
import { clearPassengerSelection, savePassengerSelection } from "@/lib/passenger-selection";
import {
  passengerBookInfoFromExchangeSnapshot,
  enrichExchangePassengerContact,
} from "@/lib/train-exchange-passenger";
import { buildTrainExchangeListPath, saveTrainExchangeSession } from "@/lib/train-exchange-session";

const TRAIN_TICKET_BOOKING_STATUSES = new Set(["1", "Booking"]);

export function isTrainTicketBookingInProgress(ticket?: TrainOrderTicket): boolean {
  if (!ticket) return false;
  const status = ticket.Status?.trim();
  if (status && TRAIN_TICKET_BOOKING_STATUSES.has(status)) return true;
  if (status === "2" || status === "Booked" || status === "8" || status === "BookExchanged") {
    return false;
  }
  const labels = [ticket.AppStatusName, ticket.StatusName].filter(Boolean).join(" ");
  return /预订中/.test(labels);
}

export function mergeTrainFooterActions(
  orderActions: HotelOrderActionFlags | undefined,
  ticket?: TrainOrderTicket,
): HotelOrderActionFlags {
  const base: HotelOrderActionFlags = orderActions ?? {
    showPay: false,
    showCancel: false,
    smsAction: "none",
  };
  if (isTrainTicketBookingInProgress(ticket)) {
    return {
      ...base,
      showPay: false,
      showCancel: false,
      showIssue: false,
      showRefund: ticket?.Actions?.showRefund,
      showExchange: ticket?.Actions?.showExchange,
    };
  }
  return {
    ...base,
    showCancel: base.showCancel || Boolean(ticket?.Actions?.showCancel),
    showRefund: ticket?.Actions?.showRefund,
    showExchange: ticket?.Actions?.showExchange,
  };
}

export function resolveTrainCountdownLabel(actions: HotelOrderActionFlags | undefined): {
  prefix: string;
  suffix: string;
} {
  if (actions?.showIssue && !actions.showPay) {
    return { prefix: "订单将在", suffix: "后关闭" };
  }
  return { prefix: "支付剩余", suffix: "" };
}

export async function startTrainExchangeFlow(input: {
  channel?: "tmc" | "tourist";
  ticketId: string;
  orderId?: string;
  navigate: (path: string) => void;
}): Promise<void> {
  const exchangeInfo = await getApi().train.getExchangeInfo({
    channel: input.channel,
    TicketId: input.ticketId,
  });
  // Legacy policy matching uses OrderTrainTicket.Passenger.AccountId from GetExchangeInfo.
  const passengerSnapshot = exchangeInfo.passengerSnapshot;
  const passengers = passengerSnapshot
    ? [
        enrichExchangePassengerContact(
          passengerBookInfoFromExchangeSnapshot(passengerSnapshot),
          exchangeInfo,
        ),
      ]
    : [];
  if (passengers.length === 0) {
    clearPassengerSelection(ProductType.Train);
    throw new Error("无法获取改签乘车人信息");
  }
  savePassengerSelection(ProductType.Train, passengers);
  saveTrainExchangeSession({
    ticketId: input.ticketId,
    orderId: input.orderId ?? exchangeInfo.OrderId,
    exchangeInfo: { ...exchangeInfo, TicketId: input.ticketId },
    passengers,
    startedAt: Date.now(),
  });
  input.navigate(buildTrainExchangeListPath(exchangeInfo));
}
