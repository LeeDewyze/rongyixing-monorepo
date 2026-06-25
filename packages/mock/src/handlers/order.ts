import type { IResponse, OrderListParams } from "@ryx/shared-types";
import { HOTEL_FLOW_METHODS, ORDER_FLOW_METHODS, successResponse } from "@ryx/api";

import { buildOrderListResponse } from "../fixtures/order.js";
import { createHotelMockHandlers } from "./hotel.js";

let hotelHandlers: ReturnType<typeof createHotelMockHandlers> | null = null;

function getHotelHandlers() {
  if (!hotelHandlers) {
    hotelHandlers = createHotelMockHandlers();
  }
  return hotelHandlers;
}

export function createOrderMockHandlers(): Record<string, (data: unknown) => IResponse<unknown>> {
  return {
    [ORDER_FLOW_METHODS.LIST]: (data) => {
      const params = (data ?? {}) as OrderListParams;
      return successResponse(buildOrderListResponse(params));
    },
    [ORDER_FLOW_METHODS.DETAIL]: (data) =>
      getHotelHandlers()[HOTEL_FLOW_METHODS.ORDER_DETAIL]!(data),
    [ORDER_FLOW_METHODS.CANCEL_HOTEL]: (data) =>
      getHotelHandlers()[HOTEL_FLOW_METHODS.CANCEL_HOTEL]!(data),
    [ORDER_FLOW_METHODS.GET_ORDER_PAYS]: (data) =>
      getHotelHandlers()[HOTEL_FLOW_METHODS.GET_ORDER_PAYS]!(data),
    [ORDER_FLOW_METHODS.GET_TOTAL_PAY_AMOUNT]: (data) => {
      const params = data as { OrderId?: string };
      const state = getHotelHandlers()[HOTEL_FLOW_METHODS.ORDER_DETAIL]!({
        OrderId: params?.OrderId ?? "ORD-MOCK",
      });
      const detail = state.Data as { TotalAmount?: number };
      return successResponse({
        TotalPayAmount: detail?.TotalAmount ?? 589,
        PayHoldTime: 20,
      });
    },
    [ORDER_FLOW_METHODS.PAY_CREATE]: (data) =>
      getHotelHandlers()[HOTEL_FLOW_METHODS.PAY_CREATE]!(data),
    [ORDER_FLOW_METHODS.PAY_PROCESS]: () => successResponse({ Success: true, Message: "支付成功" }),
  };
}
