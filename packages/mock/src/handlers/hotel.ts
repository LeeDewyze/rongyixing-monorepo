import type { IResponse } from "@ryx/shared-types";
import {
  HOTEL_FLOW_METHODS,
  successResponse,
  TMC_METHODS,
} from "@ryx/api";

import {
  MOCK_HOTEL_DETAIL,
  MOCK_HOTEL_LIST,
} from "../fixtures/hotel.js";
import {
  createMockOrderDetail,
  MOCK_ORDER_PAYS,
  resolveOrderDetail,
  type MockOrderState,
} from "../fixtures/order.js";

const orderStore = new Map<string, MockOrderState>();

function getOrCreateOrder(orderId: string) {
  if (!orderStore.has(orderId)) {
    orderStore.set(orderId, createMockOrderDetail(orderId));
  }
  return orderStore.get(orderId)!;
}

export function createHotelMockHandlers(): Record<
  string,
  (data: unknown) => IResponse<unknown>
> {
  return {
    [TMC_METHODS.RESOURCE_DOMESTICHOTELCITY]: () =>
      successResponse([
        { Code: "010", Name: "北京", Pinyin: "beijing" },
        { Code: "021", Name: "上海", Pinyin: "shanghai" },
      ]),
    [HOTEL_FLOW_METHODS.LIST]: () => successResponse(MOCK_HOTEL_LIST),
    [HOTEL_FLOW_METHODS.DETAIL]: (data) => {
      const params = data as { HotelId?: string };
      if (params?.HotelId && params.HotelId !== MOCK_HOTEL_DETAIL.HotelId) {
        return successResponse({ ...MOCK_HOTEL_DETAIL, HotelId: params.HotelId });
      }
      return successResponse(MOCK_HOTEL_DETAIL);
    },
    [HOTEL_FLOW_METHODS.POLICY]: () =>
      successResponse({
        IsIllegal: false,
        Policies: ["符合差旅标准"],
      }),
    [HOTEL_FLOW_METHODS.INIT]: (data) => {
      const params = data as { PlanId?: string };
      const plan = MOCK_HOTEL_DETAIL.Rooms?.flatMap((r) => r.Plans).find(
        (p) => p.PlanId === params?.PlanId,
      );
      return successResponse({
        OrderAmount: plan?.Price ?? 398,
        ServiceFees: { Total: 0 },
        IllegalReasons: [],
        ExpenseTypes: [{ Id: "1", Name: "住宿费", Tag: "hotel" }],
        Staffs: [],
      });
    },
    [HOTEL_FLOW_METHODS.BOOK]: () => {
      const orderId = `ORD${Date.now()}`;
      const order = createMockOrderDetail(orderId);
      orderStore.set(orderId, order);
      return successResponse({
        OrderId: orderId,
        OrderNumber: order.OrderNumber,
      });
    },
    [HOTEL_FLOW_METHODS.ORDER_DETAIL]: (data) => {
      const params = data as { OrderId?: string };
      const orderId = params?.OrderId ?? "ORD-MOCK";
      const state = getOrCreateOrder(orderId);
      return successResponse(resolveOrderDetail(state));
    },
    [HOTEL_FLOW_METHODS.CANCEL_HOTEL]: () => successResponse(true),
    [HOTEL_FLOW_METHODS.GET_ORDER_PAYS]: () => successResponse(MOCK_ORDER_PAYS),
    [HOTEL_FLOW_METHODS.PAY_CREATE]: (data) => {
      const params = data as { OrderId?: string };
      return successResponse({
        PayOrderId: `PAY${Date.now()}`,
        PayUrl: `/pay/mock?orderId=${params?.OrderId ?? ""}`,
      });
    },
  };
}

export function resetHotelMockStore(): void {
  orderStore.clear();
}

export function getOrderDetailMockHandler() {
  return createHotelMockHandlers()[HOTEL_FLOW_METHODS.ORDER_DETAIL]!;
}

export function getCancelHotelMockHandler() {
  return createHotelMockHandlers()[HOTEL_FLOW_METHODS.CANCEL_HOTEL]!;
}
