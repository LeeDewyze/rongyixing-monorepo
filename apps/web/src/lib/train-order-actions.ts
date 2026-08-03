import type { HotelOrderActionFlags, TrainOrderTicket } from "@ryx/shared-types";
import { ProductType } from "@ryx/shared-types";

import { getApi } from "@/lib/api";
import { savePassengerSelection } from "@/lib/passenger-selection";
import {
  passengerBookInfoFromExchangeSnapshot,
  enrichExchangePassengerContact,
} from "@/lib/train-exchange-passenger";
import { buildTrainExchangeListPath, saveTrainExchangeSession } from "@/lib/train-exchange-session";

export function mergeTrainFooterActions(
  orderActions: HotelOrderActionFlags | undefined,
  ticket?: TrainOrderTicket,
): HotelOrderActionFlags {
  const base: HotelOrderActionFlags = orderActions ?? {
    showPay: false,
    showCancel: false,
    smsAction: "none",
  };
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
  const [exchangeInfo, passengerSnapshot] = await Promise.all([
    getApi().train.getExchangeInfo({
      channel: input.channel,
      TicketId: input.ticketId,
    }),
    getApi().train.getTrainPassengerBookSnapshot({
      channel: input.channel,
      TicketId: input.ticketId,
    }),
  ]);
  const passengers = passengerSnapshot
    ? [
        enrichExchangePassengerContact(
          passengerBookInfoFromExchangeSnapshot(passengerSnapshot),
          exchangeInfo,
        ),
      ]
    : [];
  if (passengers.length > 0) {
    savePassengerSelection(ProductType.Train, passengers);
  }
  saveTrainExchangeSession({
    ticketId: input.ticketId,
    orderId: input.orderId ?? exchangeInfo.OrderId,
    exchangeInfo: { ...exchangeInfo, TicketId: input.ticketId },
    passengers,
    startedAt: Date.now(),
  });
  input.navigate(buildTrainExchangeListPath(exchangeInfo));
}
