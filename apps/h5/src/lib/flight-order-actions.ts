import type { FlightExchangeInfo } from "@ryx/shared-types";
import { ProductType } from "@ryx/shared-types";

import { getApi } from "@/lib/api";
import { clearFlightBookSelection } from "@/lib/flight-book-session";
import { passengerBookInfoFromFlightExchangeSnapshot } from "@/lib/flight-exchange-passenger";
import {
  buildFlightExchangeListPath,
  clearFlightExchangeSession,
  saveFlightExchangeSession,
} from "@/lib/flight-exchange-session";
import { clearPassengerSelection, savePassengerSelection } from "@/lib/passenger-selection";

function mergeFlightExchangeInfo(input: {
  exchangeInfo: FlightExchangeInfo;
  orderId?: string;
  ticketId: string;
  exchangeDate?: string;
}): FlightExchangeInfo {
  return {
    ...input.exchangeInfo,
    TicketId: input.ticketId,
    OrderId: input.exchangeInfo.OrderId ?? input.orderId,
    Date: input.exchangeInfo.Date ?? input.exchangeDate,
  };
}

export async function startFlightExchangeFlow(input: {
  channel?: "tmc" | "tourist";
  ticketId: string;
  orderId?: string;
  exchangeDate?: string;
  navigate: (path: string) => void;
}): Promise<void> {
  const api = getApi();
  clearFlightBookSelection();
  clearFlightExchangeSession();
  const exchangeInfo = await api.order.getExchangeFlightTrip({
    channel: input.channel,
    TicketId: input.ticketId,
    OrderId: input.orderId,
    ExchangeDate: input.exchangeDate,
  });
  const mergedInfo = mergeFlightExchangeInfo({
    exchangeInfo,
    orderId: input.orderId,
    ticketId: input.ticketId,
    exchangeDate: input.exchangeDate,
  });

  if (!mergedInfo.Date || !mergedInfo.FromCode || !mergedInfo.ToCode) {
    throw new Error("无法获取改签航班查询条件");
  }

  const passenger = exchangeInfo.passengerSnapshot
    ? passengerBookInfoFromFlightExchangeSnapshot(exchangeInfo.passengerSnapshot)
    : null;
  const passengers = passenger ? [passenger] : [];
  if (passengers.length === 0) {
    clearPassengerSelection(ProductType.Flight);
    throw new Error("无法获取改签乘机人信息");
  }
  savePassengerSelection(ProductType.Flight, passengers);

  saveFlightExchangeSession({
    ticketId: input.ticketId,
    orderId: mergedInfo.OrderId,
    exchangeInfo: mergedInfo,
    passengers,
    startedAt: Date.now(),
  });
  input.navigate(buildFlightExchangeListPath(mergedInfo, input.channel));
}
