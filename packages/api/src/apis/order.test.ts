import { OrderListTabId } from "@ryx/shared-types";
import { describe, expect, it, vi } from "vitest";

import { ORDER_FLOW_METHODS, TOURIST_ORDER_FLOW_METHODS } from "../methods/order-flow.js";
import { createOrderApi } from "./order.js";
import {
  buildOrderListRequest,
  normalizeOrderListResponse,
  orderListTabIdToType,
} from "./order-list-map.js";

describe("buildOrderListRequest", () => {
  it("maps tab id to legacy Type and zero-based page index", () => {
    expect(buildOrderListRequest({ TabId: OrderListTabId.Hotel, PageIndex: 0 })).toEqual({
      pageIndex: 0,
      PageIndex: 0,
      PageSize: 20,
      Type: "Hotel",
    });
  });

  it("maps flight tab to Flight type", () => {
    expect(orderListTabIdToType(OrderListTabId.Flight)).toBe("Flight");
    expect(buildOrderListRequest({ TabId: OrderListTabId.Flight }).Type).toBe("Flight");
  });
});

describe("createOrderApi list and detail channel routing", () => {
  it("uses TMC order list method by default", async () => {
    const send = vi.fn().mockResolvedValue({ Orders: [], DataCount: 0 });
    const api = createOrderApi({ send } as never);

    await api.getList({ TabId: OrderListTabId.Flight, Scope: "all", PageIndex: 0 });

    expect(send).toHaveBeenCalledWith({
      method: ORDER_FLOW_METHODS.LIST,
      data: {
        pageIndex: 0,
        PageIndex: 0,
        PageSize: 20,
        Type: "Flight",
      },
    });
  });

  it("uses tourist order list method when channel is tourist", async () => {
    const send = vi.fn().mockResolvedValue({ Orders: [], DataCount: 0 });
    const api = createOrderApi({ send } as never);

    await api.getList({
      channel: "tourist",
      TabId: OrderListTabId.Hotel,
      Scope: "all",
      PageIndex: 1,
    });

    expect(send).toHaveBeenCalledWith({
      method: TOURIST_ORDER_FLOW_METHODS.LIST,
      data: {
        pageIndex: 1,
        PageIndex: 1,
        PageSize: 20,
        Type: "Hotel",
      },
    });
  });

  it("uses tourist travel list method for pending tourist orders", async () => {
    const send = vi.fn().mockResolvedValue({ Trips: [], DataCount: 0 });
    const api = createOrderApi({ send } as never);

    await api.getList({
      channel: "tourist",
      TabId: OrderListTabId.Train,
      Scope: "pendingTravel",
    });

    expect(send).toHaveBeenCalledWith({
      method: TOURIST_ORDER_FLOW_METHODS.TRAVEL_LIST,
      data: {
        pageIndex: 0,
        PageIndex: 0,
        PageSize: 20,
        Type: "Train",
      },
    });
  });

  it("uses tourist order detail method when channel is tourist", async () => {
    const send = vi.fn().mockResolvedValue({ Data: { Id: "ORD-1" } });
    const api = createOrderApi({ send } as never);

    await api.getDetail({ channel: "tourist", OrderId: "ORD-1" });

    expect(send).toHaveBeenCalledWith({
      method: TOURIST_ORDER_FLOW_METHODS.DETAIL,
      data: { Id: "ORD-1", OrderId: "ORD-1" },
    });
  });
});

describe("normalizeOrderListResponse", () => {
  it("maps legacy flight ticket id and refund action for list handoff", () => {
    const response = normalizeOrderListResponse(
      {
        Orders: [
          {
            Id: "FO-1",
            Status: "Completed",
            StatusName: "交易完成",
            TotalAmount: 860,
            OrderFlightTickets: [
              {
                Id: "TICKET-1",
                AppStatusName: "已出票",
                Variables: JSON.stringify({ isShowRefundButton: true }),
                Passenger: { Name: "姜茗豪" },
                OrderFlightTrips: [
                  {
                    FlightNumber: "CA1234",
                    FromCityName: "北京",
                    ToCityName: "上海",
                    TakeoffTime: "2026-06-27T08:00:00",
                    OrderFlightTicket: {
                      Passenger: { Name: "姜茗豪" },
                    },
                  },
                ],
              },
              {
                Id: "TICKET-2",
                AppStatusName: "已出票",
                Variables: JSON.stringify({ isShowExchangeButton: true }),
                Passenger: { Name: "申晓杰" },
                OrderFlightTrips: [
                  {
                    FlightNumber: "CA1234",
                    FromCityName: "北京",
                    ToCityName: "上海",
                    TakeoffTime: "2026-06-27T08:00:00",
                    OrderFlightTicket: {
                      Passenger: { Name: "申晓杰" },
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
      OrderListTabId.Flight,
    );

    expect(response.Orders[0]).toMatchObject({
      tabId: OrderListTabId.Flight,
      OrderId: "FO-1",
      TicketId: "TICKET-1",
      TicketStatusName: "已出票",
      PassengerNames: "姜茗豪",
      Actions: [],
      Tickets: [
        {
          TicketId: "TICKET-1",
          PassengerNames: "姜茗豪",
          Actions: [{ kind: "refund", label: "退票" }],
        },
        {
          TicketId: "TICKET-2",
          PassengerNames: "申晓杰",
          Actions: [{ kind: "exchange", label: "改签" }],
        },
      ],
    });
  });

  it("maps legacy hotel order entity to UI item", () => {
    const response = normalizeOrderListResponse(
      {
        Orders: [
          {
            Id: "207600000000137",
            Status: "Completed",
            StatusName: "交易完成",
            TotalAmount: 633,
            Variables: JSON.stringify({ isPay: false, isShowCancelButton: false }),
            OrderHotels: [
              {
                HotelName: "北京朝阳望京科技园亚朵酒店",
                BeginDate: "2026-06-21",
                EndDate: "2026-06-22T00:00:00",
                countDay: 1,
                RoomName: "高级大床房(智能投屏) (内窗)",
                Passenger: { Name: "SUN/XUE" },
              },
            ],
          },
        ],
        DataCount: 20,
      },
      OrderListTabId.Hotel,
    );

    expect(response.TotalCount).toBe(20);
    expect(response.Orders).toHaveLength(1);
    expect(response.Orders[0]).toMatchObject({
      tabId: OrderListTabId.Hotel,
      OrderId: "207600000000137",
      StatusName: "交易完成",
      HotelName: "北京朝阳望京科技园亚朵酒店",
      CheckInDate: "2026-06-21",
      CheckOutDate: "2026-06-22",
      Nights: 1,
      PassengerNames: "SUN/XUE",
      TotalAmount: 633,
    });
  });
});
