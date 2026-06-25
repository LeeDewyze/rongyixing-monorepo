import type {
  OrderDetailParams,
  OrderPayChannel,
  PayCreateParams,
  PayCreateResponse,
  PayProcessParams,
  PayProcessResponse,
  PayTotalAmountParams,
  PayTotalAmountResponse,
} from "@ryx/shared-types";

import { ORDER_FLOW_METHODS } from "../methods/order-flow.js";
import type { ProxyClient } from "../proxy/proxy-client.js";
import {
  buildLegacyPayCreatePayload,
  buildLegacyPayProcessPayload,
  normalizeOrderPayChannels,
  normalizePayCreateResponse,
} from "./pay-adapter.js";

export interface PayApi {
  getTotalPayAmount(params: PayTotalAmountParams): Promise<PayTotalAmountResponse>;
  getOrderPays(params: OrderDetailParams): Promise<OrderPayChannel[]>;
  create(params: PayCreateParams): Promise<PayCreateResponse>;
  process(params: PayProcessParams): Promise<PayProcessResponse>;
}

export function createPayApi(proxy: ProxyClient): PayApi {
  return {
    getTotalPayAmount(params) {
      return proxy.send<PayTotalAmountResponse>({
        method: ORDER_FLOW_METHODS.GET_TOTAL_PAY_AMOUNT,
        data: {
          Channel: "App",
          OrderId: params.OrderId,
          Key: params.Key ?? "",
        },
      });
    },
    async getOrderPays(params) {
      const result = await proxy.send<unknown>({
        method: ORDER_FLOW_METHODS.GET_ORDER_PAYS,
        data: params,
      });
      return normalizeOrderPayChannels(result);
    },
    async create(params) {
      const result = await proxy.send<unknown>({
        method: ORDER_FLOW_METHODS.PAY_CREATE,
        data: buildLegacyPayCreatePayload({
          orderId: params.OrderId,
          payType: params.PayType,
          key: params.Key,
        }),
      });
      return normalizePayCreateResponse(result);
    },
    process(params) {
      const payload =
        params.OutTradeNo && (params.Type || params.PayType)
          ? buildLegacyPayProcessPayload({
              outTradeNo: params.OutTradeNo,
              payType: params.Type ?? params.PayType ?? "",
            })
          : params;
      return proxy.send<PayProcessResponse>({
        method: ORDER_FLOW_METHODS.PAY_PROCESS,
        data: payload,
      });
    },
  };
}
