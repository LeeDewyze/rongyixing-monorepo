import type {
  HotelCancelParams,
  HotelOrderSmsConfirmParams,
  HotelOrderSmsParams,
  OrderDetailParams,
  OrderDetailResponse,
  OrderListParams,
  OrderListResponse,
} from "@ryx/shared-types";

import { ORDER_FLOW_METHODS } from "../methods/order-flow.js";
import type { ProxyClient } from "../proxy/proxy-client.js";
import {
  normalizeHotelOrderDetail,
  normalizeOrderDetailResponse,
  shouldNormalizeHotelDetail,
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
  sendHotelOrderSmsCode(params: HotelOrderSmsParams): Promise<boolean>;
  confirmHotelOrderSmsCode(params: HotelOrderSmsConfirmParams): Promise<boolean>;
  checkInspurRepush(params: OrderDetailParams): Promise<boolean>;
}

export function createOrderApi(proxy: ProxyClient): OrderApi {
  return {
    async getList(params) {
      const tabId = resolveOrderListTabId(params);
      if (tabId == null) {
        return { Orders: [], TotalCount: 0 };
      }

      const request = buildOrderListRequest(params);
      if (isPendingTravelScope(params.Scope)) {
        const data = await proxy.send<unknown>({
          method: ORDER_FLOW_METHODS.TRAVEL_LIST,
          data: request,
        });
        return normalizeTravelListResponse(data, tabId);
      }

      const data = await proxy.send<unknown>({
        method: ORDER_FLOW_METHODS.LIST,
        data: request,
      });
      return normalizeOrderListResponse(data, tabId);
    },
    async getDetail(params) {
      const orderId = params.OrderId;
      const raw = await proxy.send<unknown>({
        method: ORDER_FLOW_METHODS.DETAIL,
        // Legacy ryx TmcOrderService.getOrderDetailAsync sends { Id }, not OrderId.
        data: { Id: orderId, OrderId: orderId },
      });
      const summary = normalizeOrderDetailResponse(raw);
      if (shouldNormalizeHotelDetail(raw, summary)) {
        return normalizeHotelOrderDetail(raw);
      }
      return summary;
    },
    cancelHotel(params) {
      return proxy.send<boolean>({
        method: ORDER_FLOW_METHODS.CANCEL_HOTEL,
        data: params,
      });
    },
    sendHotelOrderSmsCode(params) {
      return proxy.send<boolean>({
        method: ORDER_FLOW_METHODS.SEND_HOTEL_SMS,
        data: params,
      });
    },
    confirmHotelOrderSmsCode(params) {
      return proxy.send<boolean>({
        method: ORDER_FLOW_METHODS.CONFIRM_HOTEL_SMS,
        data: { ...params, ProductId: params.OrderHotelId },
      });
    },
    checkInspurRepush(params) {
      return proxy.send<boolean>({
        method: ORDER_FLOW_METHODS.CHECK_INSPUR_REPUSH,
        data: { Id: params.OrderId, OrderId: params.OrderId },
      });
    },
  };
}
