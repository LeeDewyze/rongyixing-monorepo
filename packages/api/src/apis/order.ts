import type {
  FlightAbolishTicketParams,
  FlightCancelParams,
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
  TrainCancelParams,
  TrainIssueParams,
  TrainRefundParams,
} from "@ryx/shared-types";

import { ORDER_FLOW_METHODS, TOURIST_ORDER_FLOW_METHODS } from "../methods/order-flow.js";
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
  isPendingTravelScope,
  normalizeOrderListResponse,
  normalizeTravelListResponse,
  resolveOrderListTabId,
} from "./order-list-map.js";

export interface OrderApi {
  getList(params: OrderListParams): Promise<OrderListResponse>;
  getDetail(params: OrderDetailParams): Promise<OrderDetailResponse>;
  cancelHotel(params: HotelCancelParams): Promise<boolean>;
  cancelFlight(params: FlightCancelParams): Promise<boolean>;
  abolishFlightTicket(params: FlightAbolishTicketParams): Promise<boolean>;
  getFlightTicketRefundInfo(
    params: FlightTicketRefundInfoParams,
  ): Promise<FlightTicketRefundInfo>;
  refundFlight(params: FlightRefundParams): Promise<boolean>;
  nonVoluntaryRefundFlight(params: FlightNonVoluntaryRefundParams): Promise<{ Message?: string }>;
  sendHotelOrderSmsCode(params: HotelOrderSmsParams): Promise<boolean>;
  confirmHotelOrderSmsCode(params: HotelOrderSmsConfirmParams): Promise<boolean>;
  checkInspurRepush(params: OrderDetailParams): Promise<boolean>;
  cancelTrain(params: TrainCancelParams): Promise<boolean>;
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

export function createOrderApi(proxy: ProxyClient): OrderApi {
  return {
    async getList(params) {
      const tabId = resolveOrderListTabId(params);
      if (tabId == null) {
        return { Orders: [], TotalCount: 0 };
      }

      const request = buildOrderListRequest(stripChannel(params));
      if (isPendingTravelScope(params.Scope)) {
        const data = await proxy.send<unknown>({
          method: orderMethods(params).TRAVEL_LIST,
          data: request,
        });
        return normalizeTravelListResponse(data, tabId);
      }

      const data = await proxy.send<unknown>({
        method: orderMethods(params).LIST,
        data: request,
      });
      return normalizeOrderListResponse(data, tabId);
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
        method: isTouristChannel(params)
          ? TOURIST_ORDER_FLOW_METHODS.REFUND_FLIGHT
          : ORDER_FLOW_METHODS.GET_FLIGHT_TICKET_REFUND_INFO,
        data: stripChannel(params),
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
    cancelTrain(params) {
      return proxy.send<boolean>({
        method: orderMethods(params).CANCEL_TRAIN,
        data: { Id: params.OrderId },
      });
    },
    issueTrain(params) {
      return proxy.send<boolean>({
        method: orderMethods(params).ISSUE_TRAIN,
        data: { Id: params.OrderId, OrderId: params.OrderId },
      });
    },
    refundTrain(params) {
      return proxy.send<boolean>({
        method: isTouristChannel(params)
          ? TOURIST_ORDER_FLOW_METHODS.CANCEL_TRAIN
          : ORDER_FLOW_METHODS.TRAIN_REFUND,
        data: stripChannel(params),
      });
    },
  };
}
