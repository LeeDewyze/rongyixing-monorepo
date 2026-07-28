import type { FlightExchangeInfo, FlightOrderTicket } from "@ryx/shared-types";
import { ProductType } from "@ryx/shared-types";

import { getApi } from "@/lib/api";
import { clearFlightBookSelection } from "@/lib/flight-book-session";
import { passengerBookInfoFromFlightTicket } from "@/lib/flight-exchange-passenger";
import {
  buildFlightExchangeListPath,
  clearFlightExchangeSession,
  saveFlightExchangeSession,
} from "@/lib/flight-exchange-session";
import { clearPassengerSelection, savePassengerSelection } from "@/lib/passenger-selection";

function matchFlightTicket(ticket: FlightOrderTicket, ticketId: string): boolean {
  return ticket.Id === ticketId || ticket.Key === ticketId;
}

function formatExchangeDate(value?: string): string | undefined {
  return value?.slice(0, 10) || undefined;
}

function mergeFlightExchangeInfo(input: {
  exchangeInfo: FlightExchangeInfo;
  ticket?: FlightOrderTicket;
  orderId?: string;
  ticketId: string;
  exchangeDate?: string;
}): FlightExchangeInfo {
  const trip = input.ticket?.Trips[0];
  const date =
    input.exchangeInfo.Date ?? input.exchangeDate ?? formatExchangeDate(trip?.TakeoffTime);
  return {
    ...input.exchangeInfo,
    TicketId: input.ticketId,
    OrderId: input.exchangeInfo.OrderId ?? input.orderId,
    Date: date,
    FromCode: input.exchangeInfo.FromCode ?? trip?.FromCode ?? trip?.FromAirport,
    ToCode: input.exchangeInfo.ToCode ?? trip?.ToCode ?? trip?.ToAirport,
    FromName: input.exchangeInfo.FromName ?? trip?.FromCityName,
    ToName: input.exchangeInfo.ToName ?? trip?.ToCityName,
    FromAsAirport:
      input.exchangeInfo.FromAsAirport ??
      Boolean(input.exchangeInfo.FromAirport ?? trip?.FromAirport),
    ToAsAirport:
      input.exchangeInfo.ToAsAirport ?? Boolean(input.exchangeInfo.ToAirport ?? trip?.ToAirport),
    FlightNumber: input.exchangeInfo.FlightNumber ?? trip?.FlightNumber,
    BookType: input.exchangeInfo.BookType ?? trip?.BookType,
    PassengerMobile: input.exchangeInfo.PassengerMobile ?? input.ticket?.Traveler?.Mobile,
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
  const [exchangeInfo, detail] = await Promise.all([
    api.order.getExchangeFlightTrip({
      channel: input.channel,
      TicketId: input.ticketId,
      OrderId: input.orderId,
      ExchangeDate: input.exchangeDate,
    }),
    input.orderId
      ? api.order.getDetail({ channel: input.channel, OrderId: input.orderId }).catch(() => null)
      : Promise.resolve(null),
  ]);

  const tickets = (detail?.Tickets ?? []) as FlightOrderTicket[];
  const ticket = tickets.find((item) => matchFlightTicket(item, input.ticketId));
  if (!ticket) {
    throw new Error("无法获取原客票信息");
  }
  const mergedInfo = mergeFlightExchangeInfo({
    exchangeInfo,
    ticket,
    orderId: input.orderId,
    ticketId: input.ticketId,
    exchangeDate: input.exchangeDate,
  });

  if (!mergedInfo.Date || !mergedInfo.FromCode || !mergedInfo.ToCode) {
    throw new Error("无法获取改签航班查询条件");
  }

  const passenger = ticket ? passengerBookInfoFromFlightTicket(ticket) : null;
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
