import type { IResponse } from "@ryx/shared-types";
import { HOTEL_FLOW_METHODS, HOTEL_METHODS, successResponse, TMC_METHODS } from "@ryx/api";

import {
  MOCK_HOTEL_CONDITIONS,
  MOCK_HOTEL_DETAIL,
  MOCK_HOTEL_LIST,
  MOCK_HOTEL_POLICY,
} from "../fixtures/hotel.js";
import {
  createMockOrderDetail,
  MOCK_ORDER_PAYS,
  resolveOrderDetailPayload,
  type MockOrderState,
} from "../fixtures/order.js";

const orderStore = new Map<string, MockOrderState>();

function getOrCreateOrder(orderId: string) {
  if (!orderStore.has(orderId)) {
    orderStore.set(orderId, createMockOrderDetail(orderId));
  }
  return orderStore.get(orderId)!;
}

function createHotelListResponse(data: unknown) {
  const params = data as {
    PageIndex?: number;
    PageSize?: number;
    Orderby?: string;
    BeginPrice?: number | string;
    EndPrice?: number | string;
    Categories?: Array<string | number>;
    Geos?: Array<string | number>;
    Brands?: Array<string | number>;
    Themes?: Array<string | number>;
    Services?: Array<string | number>;
    Facilities?: Array<string | number>;
    HotelId?: string;
    SearchKey?: string;
  };
  const pageIndex = params.PageIndex ?? 0;
  const pageSize = params.PageSize ?? 20;
  const beginPrice = params.BeginPrice == null ? undefined : Number(params.BeginPrice);
  const endPrice = params.EndPrice == null ? undefined : Number(params.EndPrice);
  const categories = new Set((params.Categories ?? []).map(String));
  const geos = new Set((params.Geos ?? []).map(String));
  const brands = new Set((params.Brands ?? []).map(String));
  const themes = new Set((params.Themes ?? []).map(String));
  const services = new Set((params.Services ?? []).map(String));
  const facilities = new Set((params.Facilities ?? []).map(String));
  let hotels = [...MOCK_HOTEL_LIST.Hotels];

  if (params.HotelId) {
    hotels = hotels.filter((hotel) => hotel.HotelId === params.HotelId);
  }
  if (params.SearchKey) {
    const keyword = String(params.SearchKey).trim();
    hotels = hotels.filter((hotel) => `${hotel.HotelName} ${hotel.Address}`.includes(keyword));
  }

  if (Number.isFinite(beginPrice)) {
    hotels = hotels.filter((hotel) => (hotel.MinPrice ?? 0) >= beginPrice);
  }
  if (Number.isFinite(endPrice)) {
    hotels = hotels.filter((hotel) => (hotel.MinPrice ?? 0) <= endPrice);
  }
  if (categories.size > 0) {
    hotels = hotels.filter((hotel) => {
      const starMatched = hotel.Star != null && categories.has(String(hotel.Star));
      const tagMatched = hotel.Tags?.some((tag) => categories.has(tag)) ?? false;
      return starMatched || tagMatched;
    });
  }
  if (geos.size > 0) {
    hotels = hotels.filter((hotel) => {
      const text = `${hotel.HotelName} ${hotel.Address}`;
      return (
        (geos.has("geo-district-hongshan") && text.includes("洪山")) ||
        (geos.has("geo-district-wuchang") && text.includes("武昌")) ||
        (geos.has("geo-landmark-eastlake") && text.includes("东湖")) ||
        (geos.has("geo-metro-2-zhongnan") && text.includes("中南")) ||
        (geos.has("geo-metro-2-jianghan") && text.includes("汉阳")) ||
        geos.has("geo-company-mock")
      );
    });
  }
  if (brands.size > 0) {
    hotels = hotels.filter((hotel, index) => {
      const id = index % 2 === 0 ? "brand-atour" : index % 3 === 0 ? "brand-hyatt" : "brand-hanting";
      return brands.has(id);
    });
  }
  if (themes.size > 0) {
    hotels = hotels.filter((hotel) => {
      const business = hotel.HotelName.includes("光谷") || hotel.HotelName.includes("国际");
      return (
        (themes.has("amenity-theme-business") && business) ||
        (themes.has("amenity-theme-parent") && !business)
      );
    });
  }
  if (services.size > 0) {
    hotels = hotels.filter((hotel, index) => {
      const pickup = index % 2 === 0;
      return (
        (services.has("amenity-service-pickup") && pickup) ||
        (services.has("amenity-service-laundry") && !pickup)
      );
    });
  }
  if (facilities.size > 0) {
    hotels = hotels.filter((hotel, index) => {
      const gym = index % 3 !== 0;
      return (
        (facilities.has("amenity-facility-gym") && gym) ||
        (facilities.has("amenity-facility-parking") && !gym)
      );
    });
  }

  if (params.Orderby === "PriceAsc") {
    hotels.sort((a, b) => (a.MinPrice ?? 0) - (b.MinPrice ?? 0));
  } else if (params.Orderby === "PriceDesc") {
    hotels.sort((a, b) => (b.MinPrice ?? 0) - (a.MinPrice ?? 0));
  } else if (params.Orderby === "CategoryAsc") {
    hotels.sort((a, b) => (a.Star ?? 0) - (b.Star ?? 0));
  } else if (params.Orderby === "CategoryDesc") {
    hotels.sort((a, b) => (b.Star ?? 0) - (a.Star ?? 0));
  }

  const start = pageIndex * pageSize;
  const end = start + pageSize;
  return {
    ...MOCK_HOTEL_LIST,
    Hotels: hotels.slice(start, end),
    TotalCount: hotels.length,
  };
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
    [HOTEL_METHODS.CONDITION_GETS]: () => successResponse(MOCK_HOTEL_CONDITIONS),
    [HOTEL_METHODS.HOME_SEARCHHOTEL]: (data) => {
      const keyword = String((data as { Keyword?: string })?.Keyword ?? "").trim();
      const hotelItems = MOCK_HOTEL_LIST.Hotels.filter((hotel) =>
        hotel.HotelName.includes(keyword),
      ).map((hotel) => ({
        Text: hotel.HotelName,
        Value: hotel.HotelId,
        IsHotel: true,
      }));
      const addressItems = [
        { Text: "北京商大春公寓", IsAddress: true, Lat: "39.983537", Lng: "116.318551" },
        { Text: "王府井商圈", IsAddress: true, Lat: "39.915599", Lng: "116.411056" },
        { Text: "望京地铁站", IsAddress: true, Lat: "40.004168", Lng: "116.469409" },
      ].filter((item) => item.Text.includes(keyword));
      return successResponse([...hotelItems, ...addressItems]);
    },
    [HOTEL_FLOW_METHODS.LIST]: (data) => successResponse(createHotelListResponse(data)),
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
      const params = data as { OrderId?: string; Id?: string };
      const orderId = params?.Id ?? params?.OrderId ?? "ORD-MOCK";
      const state = getOrCreateOrder(orderId);
      return successResponse(resolveOrderDetailPayload(orderId, state));
    },
    [HOTEL_FLOW_METHODS.CANCEL_HOTEL]: () => successResponse(true),
    [HOTEL_FLOW_METHODS.GET_ORDER_PAYS]: () => successResponse(MOCK_ORDER_PAYS),
    [HOTEL_FLOW_METHODS.PAY_CREATE]: (data) => {
      const params = data as { OrderId?: string };
      const payOrderId = `PAY${Date.now()}`;
      return successResponse({
        PayOrderId: payOrderId,
        OutTradeNo: payOrderId,
        Number: payOrderId,
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
