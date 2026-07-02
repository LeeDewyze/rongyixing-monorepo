import type { HotelOrderActionFlags, TrainOrderTicket } from "@ryx/shared-types";

import { getApi } from "@/lib/api";
import {
  buildTrainExchangeListPath,
  saveTrainExchangeSession,
} from "@/lib/train-exchange-session";

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
  ticketId: string;
  orderId?: string;
  navigate: (path: string) => void;
}): Promise<void> {
  const exchangeInfo = await getApi().train.getExchangeInfo({ TicketId: input.ticketId });
  saveTrainExchangeSession({
    ticketId: input.ticketId,
    orderId: input.orderId ?? exchangeInfo.OrderId,
    exchangeInfo: { ...exchangeInfo, TicketId: input.ticketId },
    startedAt: Date.now(),
  });
  input.navigate(buildTrainExchangeListPath(exchangeInfo));
}
