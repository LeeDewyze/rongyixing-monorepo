import type { IResponse } from "@ryx/shared-types";
import { HOTEL_FLOW_METHODS, ORDER_FLOW_METHODS, successResponse } from "@ryx/api";

import { MOCK_ORDER_LIST } from "../fixtures/order.js";
import { createHotelMockHandlers } from "./hotel.js";

let hotelHandlers: ReturnType<typeof createHotelMockHandlers> | null = null;

function getHotelHandlers() {
  if (!hotelHandlers) {
    hotelHandlers = createHotelMockHandlers();
  }
  return hotelHandlers;
}

export function createOrderMockHandlers(): Record<
  string,
  (data: unknown) => IResponse<unknown>
> {
  return {
    [ORDER_FLOW_METHODS.LIST]: () => successResponse(MOCK_ORDER_LIST),
    [ORDER_FLOW_METHODS.DETAIL]: (data) =>
      getHotelHandlers()[HOTEL_FLOW_METHODS.ORDER_DETAIL]!(data),
    [ORDER_FLOW_METHODS.CANCEL_HOTEL]: (data) =>
      getHotelHandlers()[HOTEL_FLOW_METHODS.CANCEL_HOTEL]!(data),
    [ORDER_FLOW_METHODS.GET_ORDER_PAYS]: (data) =>
      getHotelHandlers()[HOTEL_FLOW_METHODS.GET_ORDER_PAYS]!(data),
    [ORDER_FLOW_METHODS.PAY_CREATE]: (data) =>
      getHotelHandlers()[HOTEL_FLOW_METHODS.PAY_CREATE]!(data),
    [ORDER_FLOW_METHODS.PAY_PROCESS]: () =>
      successResponse({ Success: true, Message: "支付成功" }),
  };
}
