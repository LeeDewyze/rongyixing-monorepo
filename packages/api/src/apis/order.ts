import type {
  FlightAbolishTicketParams,
  FlightCancelParams,
  FlightExchangeInfo,
  FlightExchangeInfoParams,
  FlightNonVoluntaryRefundParams,
  FlightRefundParams,
  FlightTicketRefundInfo,
  FlightTicketRefundInfoParams,
  HotelCancelParams,
  HotelOrderSmsConfirmParams,
  HotelOrderSmsParams,
  OrderDetailParams,
  OrderDetailResponse,
  OrderListParams,
  OrderListResponse,
  TrainAbolishTicketParams,
  TrainCancelParams,
  TrainIssueParams,
  TrainRefundParams,
} from "@ryx/shared-types";

import { ORDER_FLOW_METHODS, TOURIST_ORDER_FLOW_METHODS } from "../methods/order-flow.js";
import { TOURIST_TRAIN_FLOW_METHODS } from "../methods/train-flow.js";
import type { ProxyClient } from "../proxy/proxy-client.js";
import {
  normalizeFlightOrderDetail,
  normalizeHotelOrderDetail,
  normalizeOrderDetailResponse,
  normalizeTrainOrderDetail,
  shouldNormalizeFlightDetail,
  shouldNormalizeHotelDetail,
  shouldNormalizeTrainDetail,
} from "./order-detail-map.js";
import {
  buildOrderListRequest,
  buildTravelListRequest,
  isPendingTravelScope,
  normalizeOrderListResponse,
  normalizeTravelListResponse,
  resolveOrderListTabId,
} from "./order-list-map.js";
import {
  asArray,
  asRecord,
  extractPayload,
  formatDateOnly,
  parseVariablesObj,
  readNumber,
  readString,
  type LegacyRecord,
} from "./legacy-parse.js";

export interface OrderApi {
  getList(params: OrderListParams): Promise<OrderListResponse>;
  getDetail(params: OrderDetailParams): Promise<OrderDetailResponse>;
  cancelHotel(params: HotelCancelParams): Promise<boolean>;
  cancelFlight(params: FlightCancelParams): Promise<boolean>;
  abolishFlightTicket(params: FlightAbolishTicketParams): Promise<boolean>;
  getFlightTicketRefundInfo(params: FlightTicketRefundInfoParams): Promise<FlightTicketRefundInfo>;
  refundFlight(params: FlightRefundParams): Promise<boolean>;
  nonVoluntaryRefundFlight(params: FlightNonVoluntaryRefundParams): Promise<{ Message?: string }>;
  sendHotelOrderSmsCode(params: HotelOrderSmsParams): Promise<boolean>;
  confirmHotelOrderSmsCode(params: HotelOrderSmsConfirmParams): Promise<boolean>;
  checkInspurRepush(params: OrderDetailParams): Promise<boolean>;
  getExchangeFlightTrip(params: FlightExchangeInfoParams): Promise<FlightExchangeInfo>;
  cancelTrain(params: TrainCancelParams): Promise<boolean>;
  abolishTrainTicket(params: TrainAbolishTicketParams): Promise<boolean>;
  issueTrain(params: TrainIssueParams): Promise<boolean>;
  refundTrain(params: TrainRefundParams): Promise<boolean>;
}

function isTouristChannel(params?: { channel?: string }): boolean {
  return params?.channel === "tourist";
}

function stripChannel<T extends { channel?: string }>(params: T): Omit<T, "channel"> {
  const { channel: _channel, ...rest } = params;
  return rest;
}

function orderMethods(params?: { channel?: string }) {
  return isTouristChannel(params) ? TOURIST_ORDER_FLOW_METHODS : ORDER_FLOW_METHODS;
}

function readStringOrNumber(value: unknown): string | number | undefined {
  const text = readString(value);
  if (text) return text;
  return readNumber(value) ?? undefined;
}

function firstRecord(...values: unknown[]): LegacyRecord | null {
  for (const value of values) {
    const record = asRecord(value);
    if (record) return record;
    const [first] = asArray<LegacyRecord>(value);
    if (first) return first;
  }
  return null;
}

function normalizeFlightExchangeInfo(
  raw: unknown,
  params: FlightExchangeInfoParams,
): FlightExchangeInfo {
  const payload = extractPayload(raw);
  const order = asRecord(payload.Order) ?? payload;
  const orderVariables = parseVariablesObj(order);
  const ticket =
    firstRecord(payload.OrderFlightTicket, payload.OrderFlightTickets, order.OrderFlightTickets) ??
    {};
  const ticketVariables = parseVariablesObj(ticket);
  const trip =
    firstRecord(payload.OrderFlightTrip, payload.OrderFlightTrips, ticket.OrderFlightTrips) ?? {};
  const passenger = firstRecord(payload.Passenger, ticket.Passenger, payload.OrderPassengers);

  const ticketId = params.TicketId;
  const orderId = readString(payload.OrderId ?? order.Id ?? order.OrderId ?? params.OrderId);
  const date = formatDateOnly(
    payload.Date ?? payload.GoDate ?? payload.DepartDate ?? trip.TakeoffTime ?? trip.DepartTime,
  );

  return {
    TicketId: ticketId,
    OrderId: orderId || params.OrderId,
    Date: date || undefined,
    FromCode:
      readString(
        payload.FromCode ??
          payload.FromAirport ??
          trip.FromCode ??
          trip.FromAirport ??
          trip.FromAirportCode,
      ) || undefined,
    ToCode:
      readString(
        payload.ToCode ?? payload.ToAirport ?? trip.ToCode ?? trip.ToAirport ?? trip.ToAirportCode,
      ) || undefined,
    FromName:
      readString(payload.FromName ?? payload.FromCityName ?? trip.FromCityName) || undefined,
    ToName: readString(payload.ToName ?? payload.ToCityName ?? trip.ToCityName) || undefined,
    FromAirport: readString(payload.FromAirport ?? trip.FromAirport) || undefined,
    ToAirport: readString(payload.ToAirport ?? trip.ToAirport) || undefined,
    FromAsAirport: typeof payload.FromAsAirport === "boolean" ? payload.FromAsAirport : undefined,
    ToAsAirport: typeof payload.ToAsAirport === "boolean" ? payload.ToAsAirport : undefined,
    FlightNumber:
      readString(payload.FlightNumber ?? trip.FlightNumber ?? trip.Number ?? ticket.FlightNumber) ||
      undefined,
    BookType: readStringOrNumber(payload.BookType ?? trip.BookType ?? ticket.BookType),
    TravelPayType: readNumber(
      payload.TravelPayType ?? orderVariables?.TravelPayType ?? ticketVariables?.TravelPayType,
    ),
    OriginalTicketPrice: readNumber(
      payload.OriginalTicketPrice ?? payload.TicketPrice ?? trip.TicketPrice ?? ticket.TicketPrice,
    ),
    PassengerMobile: readString(payload.PassengerMobile ?? passenger?.Mobile) || undefined,
  };
}

export function createOrderApi(proxy: ProxyClient): OrderApi {
  return {
    async getList(params) {
      const tabId = resolveOrderListTabId(params);
      if (tabId == null) {
        return { Orders: [], TotalCount: 0 };
      }

      if (isPendingTravelScope(params.Scope)) {
        const { data, requestType } = buildTravelListRequest(stripChannel(params));
        const travelData = await proxy.send<unknown>({
          method: orderMethods(params).TRAVEL_LIST,
          data,
          requestFields: requestType ? { Type: requestType } : undefined,
        });
        return normalizeTravelListResponse(travelData, tabId);
      }

      const request = buildOrderListRequest(stripChannel(params));

      const data = await proxy.send<unknown>({
        method: orderMethods(params).LIST,
        data: request,
      });
      return normalizeOrderListResponse(data, tabId, params.channel);
    },
    async getDetail(params) {
      const orderId = params.OrderId;
      const raw = await proxy.send<unknown>({
        method: orderMethods(params).DETAIL,
        // Legacy ryx TmcOrderService.getOrderDetailAsync sends { Id }, not OrderId.
        data: { Id: orderId, OrderId: orderId },
      });
      const summary = normalizeOrderDetailResponse(raw);
      if (shouldNormalizeTrainDetail(raw, summary)) {
        return normalizeTrainOrderDetail(raw);
      }
      if (shouldNormalizeFlightDetail(raw, summary)) {
        return normalizeFlightOrderDetail(raw);
      }
      if (shouldNormalizeHotelDetail(raw, summary)) {
        return normalizeHotelOrderDetail(raw);
      }
      return summary;
    },
    cancelHotel(params) {
      return proxy.send<boolean>({
        method: orderMethods(params).CANCEL_HOTEL,
        data: stripChannel(params),
      });
    },
    cancelFlight(params) {
      return proxy.send<boolean>({
        method: orderMethods(params).ABOLISH_ORDER,
        data: { ...stripChannel(params), Tag: params.Tag ?? "flight" },
      });
    },
    abolishFlightTicket(params) {
      return proxy.send<boolean>({
        method: orderMethods(params).ABOLISH_TICKET,
        data: stripChannel(params),
      });
    },
    getFlightTicketRefundInfo(params) {
      return proxy.send<FlightTicketRefundInfo>({
        method: ORDER_FLOW_METHODS.GET_FLIGHT_TICKET_REFUND_INFO,
        data: { Id: params.orderFlightTicket },
      });
    },
    refundFlight(params) {
      const data: Record<string, unknown> = {
        OrderFlightTicketId: params.ticketId,
        OrderId: params.orderId,
        IsVoluntary: params.IsVoluntary,
        FileName: params.FileName,
      };
      if (params.FileValue) {
        data.FileValue = params.FileValue.includes(",")
          ? params.FileValue.split(",")[1]
          : params.FileValue;
      }
      return proxy.send<boolean>({
        method: orderMethods(params).REFUND_FLIGHT,
        data,
      });
    },
    nonVoluntaryRefundFlight(params) {
      return proxy.send<{ Message?: string }>({
        method: isTouristChannel(params)
          ? TOURIST_ORDER_FLOW_METHODS.REFUND_FLIGHT
          : ORDER_FLOW_METHODS.NON_VOLUNTARY_REFUND_FLIGHT,
        data: stripChannel(params),
      });
    },
    sendHotelOrderSmsCode(params) {
      return proxy.send<boolean>({
        method: orderMethods(params).SEND_HOTEL_SMS,
        data: stripChannel(params),
      });
    },
    confirmHotelOrderSmsCode(params) {
      return proxy.send<boolean>({
        method: orderMethods(params).CONFIRM_HOTEL_SMS,
        data: { ...stripChannel(params), ProductId: params.OrderHotelId },
      });
    },
    checkInspurRepush(params) {
      return proxy.send<boolean>({
        method: ORDER_FLOW_METHODS.CHECK_INSPUR_REPUSH,
        data: { Id: params.OrderId, OrderId: params.OrderId },
      });
    },
    async getExchangeFlightTrip(params) {
      const raw = await proxy.send<unknown>({
        method: isTouristChannel(params)
          ? TOURIST_ORDER_FLOW_METHODS.EXCHANGE_FLIGHT_INIT
          : ORDER_FLOW_METHODS.EXCHANGE_FLIGHT_INIT,
        data: {
          OrderId: params.OrderId,
          OrderFlightTicketId: params.TicketId,
          ExchangeDate: params.ExchangeDate,
        },
      });
      return normalizeFlightExchangeInfo(raw, params);
    },
    cancelTrain(params) {
      return proxy.send<boolean>({
        method: orderMethods(params).CANCEL_TRAIN,
        data: { Id: params.OrderId },
      });
    },
    abolishTrainTicket(params) {
      return proxy.send<boolean>({
        method: orderMethods(params).ABOLISH_TICKET,
        data: stripChannel(params),
      });
    },
    issueTrain(params) {
      return proxy.send<boolean>({
        method: orderMethods(params).ISSUE_TRAIN,
        data: { Id: params.OrderId },
      });
    },
    refundTrain(params) {
      return proxy.send<boolean>({
        method: isTouristChannel(params)
          ? TOURIST_TRAIN_FLOW_METHODS.REFUND
          : ORDER_FLOW_METHODS.TRAIN_REFUND,
        data: { TicketId: params.TicketId },
        version: "2.0",
        requestTimeout: 60,
        timeoutMs: 60_000,
      });
    },
  };
}
