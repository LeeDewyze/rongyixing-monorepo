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

import { TOURIST_HOTEL_FLOW_METHODS } from "../methods/hotel-flow.js";
import { ORDER_FLOW_METHODS, TOURIST_ORDER_FLOW_METHODS } from "../methods/order-flow.js";
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

function isTouristChannel(params?: { channel?: string }): boolean {
  return params?.channel === "tourist";
}

function isTouristHotelPay(params?: { channel?: string; ProductType?: string }): boolean {
  return isTouristChannel(params) && params?.ProductType === "Hotel";
}

function orderPayMethods(params?: { channel?: string }) {
  return isTouristChannel(params) ? TOURIST_ORDER_FLOW_METHODS : ORDER_FLOW_METHODS;
}

function stripPayControl<T extends { channel?: string; ProductType?: string }>(
  params: T,
): Omit<T, "channel" | "ProductType"> {
  const { channel: _channel, ProductType: _productType, ...rest } = params;
  return rest;
}

export function createPayApi(proxy: ProxyClient): PayApi {
  return {
    getTotalPayAmount(params) {
      return proxy.send<PayTotalAmountResponse>({
        method: orderPayMethods(params).GET_TOTAL_PAY_AMOUNT,
        data: {
          Channel: "App",
          OrderId: params.OrderId,
          Key: params.Key ?? "",
        },
      });
    },
    async getOrderPays(params) {
      const result = await proxy.send<unknown>({
        method: orderPayMethods(params).GET_ORDER_PAYS,
        data: stripPayControl(params),
      });
      return normalizeOrderPayChannels(result);
    },
    async create(params) {
      const result = await proxy.send<unknown>({
        method: isTouristHotelPay(params)
          ? TOURIST_HOTEL_FLOW_METHODS.PAY_CREATE
          : orderPayMethods(params).PAY_CREATE,
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
          : stripPayControl(params);
      return proxy.send<PayProcessResponse>({
        method: isTouristHotelPay(params)
          ? TOURIST_HOTEL_FLOW_METHODS.PAY_PROCESS
          : orderPayMethods(params).PAY_PROCESS,
        data: payload,
      });
    },
  };
}
