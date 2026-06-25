import type { IResponse } from "@ryx/shared-types";
import { HOTEL_FLOW_METHODS, successResponse, TMC_METHODS } from "@ryx/api";

import { MOCK_HOTEL_DETAIL, MOCK_HOTEL_LIST, MOCK_HOTEL_POLICY } from "../fixtures/hotel.js";
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

export function createHotelMockHandlers(): Record<string, (data: unknown) => IResponse<unknown>> {
  return {
    [TMC_METHODS.RESOURCE_DOMESTICHOTELCITY]: () =>
      successResponse([
        { Code: "010", Name: "北京", Pinyin: "beijing", IsHot: true },
        { Code: "021", Name: "上海", Pinyin: "shanghai", IsHot: true },
        { Code: "020", Name: "广州", Pinyin: "guangzhou", IsHot: true },
        { Code: "0755", Name: "深圳", Pinyin: "shenzhen", IsHot: true },
        { Code: "0571", Name: "杭州", Pinyin: "hangzhou", IsHot: true },
        { Code: "025", Name: "南京", Pinyin: "nanjing", IsHot: true },
        { Code: "028", Name: "成都", Pinyin: "chengdu", IsHot: false },
        { Code: "027", Name: "武汉", Pinyin: "wuhan", IsHot: false },
        { Code: "023", Name: "重庆", Pinyin: "chongqing", IsHot: false },
        { Code: "029", Name: "西安", Pinyin: "xian", IsHot: false },
      ]),
    [HOTEL_FLOW_METHODS.LIST]: () => successResponse(MOCK_HOTEL_LIST),
    [HOTEL_FLOW_METHODS.DETAIL]: (data) => {
      const params = data as { HotelId?: string };
      if (params?.HotelId && params.HotelId !== MOCK_HOTEL_DETAIL.HotelId) {
        return successResponse({ ...MOCK_HOTEL_DETAIL, HotelId: params.HotelId });
      }
      return successResponse(MOCK_HOTEL_DETAIL);
    },
    [HOTEL_FLOW_METHODS.POLICY]: () => successResponse(MOCK_HOTEL_POLICY),
    [HOTEL_FLOW_METHODS.INIT]: (data) => {
      const params = data as { Passengers?: { ClientId?: string }[] };
      const clientIds = (params.Passengers ?? [])
        .map((item) => item.ClientId)
        .filter((id): id is string => Boolean(id));
      const serviceFees: Record<string, number> = {};
      for (const id of clientIds) {
        serviceFees[id] = 10;
      }
      const plan = MOCK_HOTEL_DETAIL.Rooms?.flatMap((r) => r.Plans).find(
        (p) => p.PlanId === "P001",
      );
      return successResponse({
        OrderAmount: (plan?.Price ?? 398) * Math.max(clientIds.length, 1),
        ServiceFees: serviceFees,
        PayTypes: { "1": "公付", "2": "个付（请在20分钟内完成支付）" },
        IllegalReasons: ["出差紧急", "领导安排", "其他"],
        ExpenseTypes: [{ Id: "1", Name: "住宿费", Tag: "hotel" }],
        Staffs: clientIds.map((id, index) => ({
          Id: id,
          Name: `旅客${index + 1}`,
          isAllowSelectApprove: index === 0,
          Approvers: [{ Id: "ap1", Name: "审批人甲", AccountId: "ap1" }],
        })),
        Tmc: {
          IsShowServiceFee: true,
          IsDisplayNotifyLanguage: true,
          OutNumberNameArray: ["TravelNumber"],
          OutNumberRequiryNameArray: ["TravelNumber"],
        },
        OutNumbers: { TravelNumber: ["TR001", "TR002"] },
        TmcServices: [
          { Id: "agent1", Name: "默认服务商" },
          { Id: "agent2", Name: "备用服务商" },
        ],
        isSkipApprove: true,
      });
    },
    [HOTEL_FLOW_METHODS.BOOK]: () => {
      const orderId = `ORD${Date.now()}`;
      const order = createMockOrderDetail(orderId);
      orderStore.set(orderId, order);
      return successResponse({
        OrderId: orderId,
        OrderNumber: order.OrderNumber,
        TradeNo: orderId,
        IsCheckPay: true,
        HasTasks: false,
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
