import type { OrderDetailResponse } from "@ryx/shared-types";

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

export const MOCK_ORDER_LIST = {
  TotalCount: 1,
  Orders: [
    {
      OrderId: "ORD-DEMO-001",
      OrderNumber: "HTDEMO001",
      Status: "WaitPay",
      StatusName: "待支付",
      TotalAmount: 398,
      ProductName: MOCK_HOTEL_DETAIL.HotelName,
      CreateTime: "2026-06-15 10:00:00",
    },
  ],
};
