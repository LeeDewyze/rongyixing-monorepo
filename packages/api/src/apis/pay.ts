import type {
  OrderDetailParams,
  OrderPayChannel,
  PayCreateParams,
  PayCreateResponse,
  PayProcessParams,
  PayProcessResponse,
} from "@ryx/shared-types";

import { ORDER_FLOW_METHODS } from "../methods/order-flow.js";
import type { ProxyClient } from "../proxy/proxy-client.js";

export interface PayApi {
  getOrderPays(params: OrderDetailParams): Promise<OrderPayChannel[]>;
  create(params: PayCreateParams): Promise<PayCreateResponse>;
  process(params: PayProcessParams): Promise<PayProcessResponse>;
}

export function createPayApi(proxy: ProxyClient): PayApi {
  return {
    getOrderPays(params) {
      return proxy.send<OrderPayChannel[]>({
        method: ORDER_FLOW_METHODS.GET_ORDER_PAYS,
        data: params,
      });
    },
    create(params) {
      return proxy.send<PayCreateResponse>({
        method: ORDER_FLOW_METHODS.PAY_CREATE,
        data: params,
      });
    },
    process(params) {
      return proxy.send<PayProcessResponse>({
        method: ORDER_FLOW_METHODS.PAY_PROCESS,
        data: params,
      });
    },
  };
}
