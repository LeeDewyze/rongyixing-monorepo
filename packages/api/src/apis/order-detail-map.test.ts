import { describe, expect, it } from "vitest";

import {
  normalizeHotelOrderDetail,
  normalizeOrderDetailResponse,
  shouldNormalizeHotelDetail,
} from "./order-detail-map.js";

describe("normalizeOrderDetailResponse", () => {
  it("maps legacy flight order detail", () => {
    const detail = normalizeOrderDetailResponse({
      Id: "ORD-1",
      Status: "WaitPay",
      StatusName: "待付款",
      TotalAmount: 680,
      Variables: JSON.stringify({ isPay: true }),
      OrderFlightTickets: [
        {
          StatusName: "待出票",
          OrderFlightTrips: [
            {
              FlightNumber: "KN5977",
              FromCityName: "北京",
              ToCityName: "上海",
              TakeoffTime: "2026-06-23T08:30:00",
              OrderFlightTicket: { Passenger: { Name: "张三" } },
            },
          ],
        },
      ],
    });

    expect(detail).toMatchObject({
      OrderId: "ORD-1",
      ProductType: "Flight",
      RouteTitle: "KN5977 北京—上海",
      PassengerNames: "张三",
      isShowPayButton: true,
      TotalAmount: 680,
    });
  });

  it("passes through normalized detail", () => {
    const normalized = {
      OrderId: "FLT-1",
      ProductType: "Flight" as const,
      RouteTitle: "MU5101 上海—广州",
    };
    expect(normalizeOrderDetailResponse(normalized)).toEqual(normalized);
  });

  it("maps legacy hotel order wrapped in Order envelope", () => {
    const detail = normalizeOrderDetailResponse({
      Order: {
        Id: "ORD-HTL-001",
        Status: "WaitPay",
        StatusName: "待付款",
        TotalAmount: 589,
        Variables: JSON.stringify({ isPay: true }),
        OrderHotels: [
          {
            HotelName: "测试酒店",
            BeginDate: "2026-08-09T00:00:00",
            EndDate: "2026-08-10T00:00:00",
            Passenger: { Name: "张三" },
          },
        ],
      },
      TravelPayType: "公付",
    });

    expect(detail).toMatchObject({
      OrderId: "ORD-HTL-001",
      ProductType: "Hotel",
      HotelName: "测试酒店",
      PassengerNames: "张三",
      isShowPayButton: true,
    });
  });
});

describe("normalizeHotelOrderDetail", () => {
  it("maps legacy hotel order detail with rooms and actions", () => {
    const detail = normalizeHotelOrderDetail({
      Order: {
        Id: "ORD-HTL-001",
        Status: "WaitPay",
        StatusName: "待付款",
        TotalAmount: 589,
        InsertTime: "2026-07-01T23:23:00",
        Variables: JSON.stringify({ isPay: true, isShowCancelButton: true }),
        OrderHotels: [
          {
            Id: "HOTEL-1",
            Key: "k1",
            HotelName: "测试酒店",
            RoomName: "大床房",
            BeginDate: "2026-08-09T00:00:00",
            EndDate: "2026-08-10T00:00:00",
            PaymentType: 1,
            Passenger: { Name: "张三", Mobile: "13800000000" },
          },
        ],
        OrderItems: [
          { Key: "k1", Tag: "Hotel", Name: "房费", Amount: 500 },
          { Key: "k1", Tag: "HotelOnlineFee", Name: "服务费", Amount: 20 },
        ],
        OrderPassengers: [{ Name: "张三" }],
      },
      TravelPayType: "公付",
      Histories: [
        {
          StatusName: "已通过",
          InsertTime: "2026-07-01T10:00:00",
          Account: { RealName: "审批人" },
          Variables: JSON.stringify({ TypeName: "一级审批" }),
        },
      ],
      Tmc: { IsShowServiceFee: true },
    });

    expect(detail.OrderId).toBe("ORD-HTL-001");
    expect(detail.Rooms).toHaveLength(1);
    expect(detail.Rooms[0]?.HotelName).toBe("测试酒店");
    expect(detail.Rooms[0]?.RoomFee).toBe(500);
    expect(detail.Actions.showPay).toBe(true);
    expect(detail.Actions.showCancel).toBe(true);
    expect(detail.Histories).toHaveLength(1);
    expect(detail.isShowPayButton).toBe(true);
  });

  it("maps 等待处理 to 等待审批", () => {
    const detail = normalizeHotelOrderDetail({
      Order: {
        Id: "ORD-X",
        StatusName: "等待处理",
        OrderHotels: [{ Id: "1", Key: "k1" }],
      },
    });
    expect(detail.StatusName).toBe("等待审批");
  });

  it("hides pay when status is WaitHandle", () => {
    const detail = normalizeHotelOrderDetail({
      Order: {
        Id: "ORD-X",
        Status: "WaitHandle",
        Variables: JSON.stringify({ isPay: true }),
        OrderHotels: [{ Id: "1", Key: "k1" }],
      },
    });
    expect(detail.Actions.showPay).toBe(false);
  });

  it("passes through already-normalized detail", () => {
    const normalized = {
      OrderId: "ORD-N",
      Rooms: [{ Id: "R1", Key: "k1", HotelName: "Hotel" }],
      BillItems: [],
      Histories: [],
      Actions: { showPay: false, showCancel: false, smsAction: "none" as const },
      ShowServiceFee: true,
    };
    expect(normalizeHotelOrderDetail(normalized).OrderId).toBe("ORD-N");
  });

  it("reads OrderPassengers from payload root like legacy OrderDetailModel", () => {
    const detail = normalizeHotelOrderDetail({
      Order: {
        Id: "20760000000170",
        StatusName: "已完成",
        TotalAmount: 5000,
        InsertTime: "2026-07-01T23:23:00",
        OrderHotels: [
          {
            Id: "H1",
            Key: "k1",
            HotelName: "测试酒店",
            Passenger: { Name: "房间旅客" },
          },
        ],
      },
      OrderPassengers: [{ Name: "根级旅客", Mobile: "13800000000" }],
      TravelPayType: "公付",
    });

    expect(detail.TravelPayType).toBe("公付");
    expect(detail.Rooms[0]?.Traveler?.Name).toBe("根级旅客");
    expect(detail.Rooms[0]?.Traveler?.Mobile).toBe("13800000000");
  });

  it("maps traveler fields from OrderPassengers and OrderTravels", () => {
    const detail = normalizeHotelOrderDetail({
      Order: {
        Id: "ORD-TRAVELER",
        OrderHotels: [
          {
            Id: "H1",
            Key: "room-key-1",
            Passenger: { Id: "p1", Name: "SUN/XUE" },
          },
        ],
        OrderPassengers: [
          {
            Id: "p1",
            Key: "room-key-1",
            Name: "SUN/XUE",
            Mobile: "18910943089",
            Email: "guest@example.com",
            CredentialsNumber: "EB6862294",
            CredentialsTypeName: "护照",
          },
        ],
        OrderTravels: [
          {
            Key: "room-key-1",
            CostCenterCode: "CC",
            CostCenterName: "默认",
            OrganizationCode: "A001",
            OrganizationName: "技术部",
            ExpenseType: "住宿费",
          },
        ],
        OrderNumbers: [
          { Tag: "TmcOutNumber", Key: "room-key-1", Name: "外部", Number: "TR2026001" },
        ],
      },
    });

    const traveler = detail.Rooms[0]?.Traveler;
    expect(traveler?.Name).toBe("SUN/XUE");
    expect(traveler?.Mobile).toBe("18910943089");
    expect(traveler?.Email).toBe("guest@example.com");
    expect(traveler?.CredentialNumber).toBe("EB6862294");
    expect(traveler?.CredentialType).toBe("护照");
    expect(traveler?.CostCenterName).toBe("CC-默认");
    expect(traveler?.OrganizationName).toBe("A001-技术部");
    expect(traveler?.ExpenseType).toBe("住宿费");
    expect(traveler?.OutNumbers).toBe("外部:TR2026001");
  });

  it("enriches minimal normalized detail with a synthetic room", () => {
    const detail = normalizeHotelOrderDetail({
      OrderId: "ORD-MIN",
      HotelName: "亚朵酒店",
      CheckInDate: "2026-06-20",
      CheckOutDate: "2026-06-21",
      Rooms: [],
      BillItems: [],
      Histories: [],
      Actions: { showPay: false, showCancel: false, smsAction: "none" },
      ShowServiceFee: true,
    });

    expect(detail.Rooms).toHaveLength(1);
    expect(detail.Rooms[0]?.HotelName).toBe("亚朵酒店");
  });
});

describe("shouldNormalizeHotelDetail", () => {
  it("detects hotel from nested OrderHotels when summary lacks ProductType", () => {
    const payload = {
      Order: {
        Id: "ORD-HTL-001",
        OrderHotels: [{ HotelName: "测试酒店" }],
      },
    };
    expect(shouldNormalizeHotelDetail(payload)).toBe(true);
    expect(shouldNormalizeHotelDetail(payload, { OrderId: "ORD-HTL-001" })).toBe(true);
  });
});
