import type {
  OrderDetailParams,
  OrderDetailResponse,
  OrderListParams,
  OrderListResponse,
} from "@ryx/shared-types";

import { ORDER_FLOW_METHODS } from "../methods/order-flow.js";
import type { ProxyClient } from "../proxy/proxy-client.js";
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
  cancelHotel(params: OrderDetailParams): Promise<boolean>;
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
    getDetail(params) {
      return proxy.send<OrderDetailResponse>({
        method: ORDER_FLOW_METHODS.DETAIL,
        data: params,
      });
    },
    cancelHotel(params) {
      return proxy.send<boolean>({
        method: ORDER_FLOW_METHODS.CANCEL_HOTEL,
        data: params,
      });
    },
  };
}
