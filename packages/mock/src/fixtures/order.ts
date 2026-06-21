import type { OrderDetailResponse } from "@ryx/shared-types";
import {
  OrderListTabId,
  type OrderListItem,
  type OrderListParams,
  type OrderListScope,
  type OrderListType,
} from "@ryx/shared-types";

import { MOCK_HOTEL_DETAIL } from "./hotel.js";

export interface MockOrderState extends OrderDetailResponse {
  createdAt: number;
  pollCount: number;
}

export function createMockOrderDetail(orderId: string): MockOrderState {
  return {
    OrderId: orderId,
    OrderNumber: `HT${orderId.slice(-8).toUpperCase()}`,
    Status: "Booking",
    StatusName: "预订中",
    isShowPayButton: false,
    TotalAmount: 398,
    HotelName: MOCK_HOTEL_DETAIL.HotelName,
    CheckInDate: "2026-06-20",
    CheckOutDate: "2026-06-21",
    createdAt: Date.now(),
    pollCount: 0,
  };
}

export function resolveOrderDetail(state: MockOrderState): OrderDetailResponse {
  const elapsed = Date.now() - state.createdAt;
  state.pollCount += 1;
  if (elapsed >= 3000 || state.pollCount >= 2) {
    state.Status = "WaitPay";
    state.StatusName = "待支付";
    state.isShowPayButton = true;
  }
  const { createdAt: _c, pollCount: _p, ...detail } = state;
  return detail;
}

export const MOCK_ORDER_PAYS = [
  { PayType: "Wechat", PayTypeName: "微信支付", Icon: "wechat" },
  { PayType: "Alipay", PayTypeName: "支付宝", Icon: "alipay" },
  { PayType: "Corporate", PayTypeName: "企业支付", Icon: "corporate" },
];

/** Status codes that appear under the "待出行" scope filter (mock only). */
export const PENDING_TRAVEL_STATUSES = new Set(["WaitTravel", "Issued"]);

const TYPE_TO_TAB_ID: Record<OrderListType, OrderListTabId> = {
  Flight: OrderListTabId.Flight,
  Train: OrderListTabId.Train,
  Hotel: OrderListTabId.Hotel,
  Car: OrderListTabId.Car,
  RentalCar: OrderListTabId.Car,
};

export function resolveTabIdFromParams(params: OrderListParams = {}): OrderListTabId | undefined {
  if (params.TabId != null) {
    return params.TabId;
  }
  if (params.Type) {
    return TYPE_TO_TAB_ID[params.Type];
  }
  return undefined;
}

export const MOCK_ORDERS: OrderListItem[] = [
  {
    tabId: OrderListTabId.Flight,
    OrderId: "ORD-FLT-001",
    OrderNumber: "89202092900",
    Status: "WaitPay",
    StatusName: "待付款",
    TotalAmount: 589,
    RouteTitle: "CZ8879 北京—上海",
    DepartTime: "2023-08-09 20:23:23",
    PassengerNames: "某某某、某某某",
    TicketStatusName: "待出票",
    Actions: [
      { kind: "cancel", label: "取消" },
      { kind: "pay", label: "支付" },
    ],
  },
  {
    tabId: OrderListTabId.Flight,
    OrderId: "ORD-FLT-002",
    OrderNumber: "89202092901",
    Status: "WaitTravel",
    StatusName: "待出行",
    TotalAmount: 1280,
    RouteTitle: "MU5101 上海—广州",
    DepartTime: "2023-09-15 08:30:00",
    PassengerNames: "张某某",
    TicketStatusName: "已出票",
    Actions: [
      { kind: "refund", label: "退票" },
      { kind: "exchange", label: "改签" },
    ],
  },
  {
    tabId: OrderListTabId.Flight,
    OrderId: "ORD-FLT-003",
    OrderNumber: "89202092902",
    Status: "Cancelled",
    StatusName: "已取消",
    TotalAmount: 890,
    RouteTitle: "CA1234 广州—北京",
    DepartTime: "2023-07-01 14:00:00",
    PassengerNames: "李某某",
    TicketStatusName: "已退票",
    Actions: [],
  },
  {
    tabId: OrderListTabId.Train,
    OrderId: "ORD-TRN-001",
    OrderNumber: "89202092910",
    Status: "WaitPay",
    StatusName: "待付款",
    TotalAmount: 589,
    RouteTitle: "G8879 北京南—上海站",
    DepartTime: "2023-08-09 20:23:23",
    PassengerNames: "某某某、某某某",
    TicketStatusName: "待出票",
    Actions: [
      { kind: "cancel", label: "取消" },
      { kind: "pay", label: "支付" },
    ],
  },
  {
    tabId: OrderListTabId.Train,
    OrderId: "ORD-TRN-002",
    OrderNumber: "89202092911",
    Status: "WaitTravel",
    StatusName: "待出行",
    TotalAmount: 553,
    RouteTitle: "D321 上海—杭州东",
    DepartTime: "2023-09-20 09:15:00",
    PassengerNames: "王某某",
    TicketStatusName: "已出票",
    Actions: [
      { kind: "refund", label: "退票" },
      { kind: "exchange", label: "改签" },
    ],
  },
  {
    tabId: OrderListTabId.Train,
    OrderId: "ORD-TRN-003",
    OrderNumber: "89202092912",
    Status: "Cancelled",
    StatusName: "已取消",
    TotalAmount: 320,
    RouteTitle: "K101 杭州—南京",
    DepartTime: "2023-06-10 22:30:00",
    PassengerNames: "赵某某",
    TicketStatusName: "已退票",
    Actions: [],
  },
  {
    tabId: OrderListTabId.Hotel,
    OrderId: "ORD-HTL-001",
    OrderNumber: "89202092900",
    Status: "WaitPay",
    StatusName: "待付款",
    TotalAmount: 589,
    HotelName: "武汉泽宇国际酒店（北京方庄地铁站店）",
    CheckInDate: "2026-08-09",
    CheckOutDate: "2026-08-10",
    Nights: 1,
    RoomType: "高级大床房",
    PassengerNames: "张某某",
    Actions: [
      { kind: "cancel", label: "取消" },
      { kind: "pay", label: "支付" },
    ],
  },
  {
    tabId: OrderListTabId.Hotel,
    OrderId: "ORD-HTL-002",
    OrderNumber: "89202092920",
    Status: "Completed",
    StatusName: "交易完成",
    TotalAmount: 398,
    HotelName: MOCK_HOTEL_DETAIL.HotelName ?? "北京中关村生命科学亚朵酒店",
    CheckInDate: "2026-06-20",
    CheckOutDate: "2026-06-21",
    Nights: 1,
    RoomType: "大床房",
    PassengerNames: "李某某",
    Actions: [],
  },
];

/** @deprecated Use MOCK_ORDERS + filterOrders instead. */
export const MOCK_ORDER_LIST = {
  TotalCount: MOCK_ORDERS.filter((o) => o.tabId === OrderListTabId.Hotel).length,
  Orders: MOCK_ORDERS.filter((o) => o.tabId === OrderListTabId.Hotel),
};

export function filterOrders(
  orders: OrderListItem[],
  tabId?: OrderListTabId,
  scope?: OrderListScope,
): OrderListItem[] {
  if (tabId == null) {
    return [];
  }

  let list = orders.filter((o) => o.tabId === tabId);
  if (scope === "pendingTravel") {
    list = list.filter((o) => PENDING_TRAVEL_STATUSES.has(o.Status));
  }
  return list;
}

export function buildOrderListResponse(params: OrderListParams = {}) {
  const filtered = filterOrders(MOCK_ORDERS, resolveTabIdFromParams(params), params.Scope);
  return {
    Orders: filtered,
    TotalCount: filtered.length,
  };
}
