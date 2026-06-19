import type {
  OrderDetailParams,
  OrderDetailResponse,
  OrderListParams,
  OrderListResponse,
} from "@ryx/shared-types";

import { ORDER_FLOW_METHODS } from "../methods/order-flow.js";
import type { ProxyClient } from "../proxy/proxy-client.js";

export interface OrderApi {
  getList(params: OrderListParams): Promise<OrderListResponse>;
  getDetail(params: OrderDetailParams): Promise<OrderDetailResponse>;
  cancelHotel(params: OrderDetailParams): Promise<boolean>;
}

export function createOrderApi(proxy: ProxyClient): OrderApi {
  return {
    getList(params) {
      return proxy.send<OrderListResponse>({
        method: ORDER_FLOW_METHODS.LIST,
        data: params,
      });
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
