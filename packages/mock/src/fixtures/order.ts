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
  const isFlight = /FLT|FLT-/i.test(orderId);
  if (isFlight) {
    return {
      OrderId: orderId,
      OrderNumber: `FL${orderId.slice(-8).toUpperCase()}`,
      Status: "Booking",
      StatusName: "预订中",
      isShowPayButton: false,
      TotalAmount: 680,
      ProductType: "Flight",
      RouteTitle: "KN5977 北京—上海",
      DepartTime: "2026-06-23 08:30:00",
      PassengerNames: "测试旅客",
      TicketStatusName: "待出票",
      createdAt: Date.now(),
      pollCount: 0,
    };
  }

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
    Rooms: [],
    BillItems: [],
    Histories: [],
    Actions: { showPay: false, showCancel: false, smsAction: "none" },
    ShowServiceFee: true,
    createdAt: Date.now(),
    pollCount: 0,
  };
}

/** Legacy-shaped hotel order detail for adapter integration tests and dev QA. */
export function createMockHotelOrderDetailLegacy(orderId: string) {
  const roomKeys = ["room-key-1", "room-key-2", "room-key-3"];
  const passengerId = "passenger-1";
  const orderHotels = roomKeys.map((key, index) => ({
    Id: `20760000000${170 + index}`,
    Key: key,
    HotelName: "武汉泽宇国际酒店（北京方庄地铁站店）",
    RoomName: index === 1 ? "高级大床房 (智能投屏)" : "高级大床房",
    Breakfast: "含早",
    StatusName: index === 1 ? "待确认" : "已确认",
    BeginDate: "2026-08-09T00:00:00",
    EndDate: "2026-08-10T00:00:00",
    CheckinTime: "2026-08-09T14:00:00",
    CheckoutTime: "2026-08-10T12:00:00",
    HotelAddress: "北京方庄地铁站向南230米",
    PaymentType: 1,
    HotelInvoice: "普通发票",
    HotelContact: "123456789000",
    SupplierName: "携程",
    RuleDescription: "您的订单一经确认，不可取消。未能如约入住，将收取全额房费。",
    Variables: JSON.stringify({
      SupplierName: "携程",
      ExceptionMessage: index === 1 ? "酒店待确认" : "",
    }),
    Passenger: { Id: passengerId, Name: "SUN/XUE" },
    CustomerName: "SUN/XUE",
  }));

  const orderItems = roomKeys.flatMap((key, index) => [
    { Key: key, Tag: "Hotel", Name: `2026-08-09 房费`, Amount: 1500 + index * 100 },
    { Key: key, Tag: "HotelOnlineFee", Name: "服务费", Amount: 50 },
  ]);

  return {
    Order: {
      Id: orderId,
      Status: orderId === "ORD-HTL-001" ? "WaitPay" : "Completed",
      StatusName: orderId === "ORD-HTL-001" ? "待付款" : "已完成",
      TotalAmount: orderId === "ORD-HTL-001" ? 589 : 398,
      InsertTime: "2026-07-01T23:23:00",
      Variables: JSON.stringify({
        isPay: orderId === "ORD-HTL-001",
        isShowCancelButton: orderId === "ORD-HTL-001",
        SelfPayAmount: 0,
      }),
      OrderHotels: orderHotels,
      OrderItems: orderItems,
      OrderPassengers: [
        {
          Id: passengerId,
          Key: "room-key-1",
          Name: "SUN/XUE",
          Mobile: "18910943089",
          Email: "",
          CredentialsNumber: "EB6862294",
          CredentialsTypeName: "护照",
        },
      ],
      OrderTravels: roomKeys.map((key) => ({
        Key: key,
        CostCenterCode: "CC",
        CostCenterName: "默认",
        OrganizationCode: "A001",
        OrganizationName: "技术部",
        ExpenseType: "住宿费",
      })),
      OrderNumbers: [{ Tag: "TmcOutNumber", Key: "room-key-1", Name: "外部", Number: "TR2026001" }],
    },
    TravelPayType: "公付",
    Histories: [
      {
        StatusName: "已通过",
        InsertTime: "2026-07-01T10:00:00",
        ExpiredTime: "2026-07-02T10:00:00",
        Account: { RealName: "审批人甲" },
        Variables: JSON.stringify({ TypeName: "一级审批" }),
      },
    ],
    Tmc: { IsShowServiceFee: true },
  };
}

export function resolveOrderDetail(state: MockOrderState): OrderDetailResponse {
  const elapsed = Date.now() - state.createdAt;
  state.pollCount += 1;
  if (elapsed >= 3000 || state.pollCount >= 2) {
    state.Status = "WaitPay";
    state.StatusName = "待支付";
    state.isShowPayButton = true;
    state.Actions = { showPay: true, showCancel: true, smsAction: "none" };
  }
  const { createdAt: _c, pollCount: _p, ...detail } = state;
  return detail;
}

export function resolveOrderDetailPayload(orderId: string, state: MockOrderState): unknown {
  if (orderId === "ORD-HTL-001" || orderId === "ORD-HTL-002") {
    return createMockHotelOrderDetailLegacy(orderId);
  }
  // Book-flow dynamic ids: return legacy shape so the detail adapter is exercised.
  if (orderId.startsWith("ORD")) {
    return createMockHotelOrderDetailLegacy(orderId);
  }
  return resolveOrderDetail(state);
}

export const MOCK_ORDER_PAYS = [
  { PayType: "3", PayTypeName: "微信支付" },
  { PayType: "2", PayTypeName: "支付宝" },
  { PayType: "6", PayTypeName: "工行快捷支付" },
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
