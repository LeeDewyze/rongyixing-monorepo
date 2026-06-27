import { describe, expect, it } from "vitest";

import {
  normalizeFlightOrderDetail,
  normalizeHotelOrderDetail,
  normalizeOrderDetailResponse,
  normalizeTrainOrderDetail,
  shouldNormalizeFlightDetail,
  shouldNormalizeHotelDetail,
  shouldNormalizeTrainDetail,
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

describe("normalizeFlightOrderDetail", () => {
  it("maps legacy flight order with tickets, travelers, and pay actions", () => {
    const detail = normalizeFlightOrderDetail({
      Order: {
        Id: "ORD-FLT-001",
        Status: "WaitPay",
        StatusName: "待付款",
        TotalAmount: 560,
        InsertTime: "2026-07-01T23:23:00",
        Variables: JSON.stringify({ OrderPayHoldTime: 8, TravelPayType: 2 }),
        OrderFlightTickets: [
          {
            Id: "T1",
            Key: "k1",
            StatusName: "预订成功",
            Passenger: { Id: "p1", Name: "郭某某" },
            OrderFlightTrips: [
              {
                FlightNumber: "KN6777",
                FromCityName: "上海",
                ToCityName: "北京",
                TakeoffTime: "2026-06-10T08:00:00",
                ArrivalTime: "2026-06-10T12:00:00",
                FlyTime: "12小时5分钟",
              },
            ],
          },
          {
            Id: "T2",
            Key: "k2",
            StatusName: "预订成功",
            Passenger: { Id: "p2", Name: "申晓杰" },
            OrderFlightTrips: [
              {
                FlightNumber: "KN5955",
                FromCityName: "北京",
                ToCityName: "上海",
                TakeoffTime: "2026-06-11T09:00:00",
              },
            ],
          },
        ],
        OrderItems: [
          { Key: "k1", Name: "机票票价", Amount: 330 },
          { Key: "k2", Name: "机票票价", Amount: 380 },
        ],
        OrderPassengers: [
          {
            Id: "p1",
            Key: "k1",
            Name: "郭某某",
            PassengerTypeName: "成人",
            HideCredentialsNumber: "410889******999999",
            CredentialsTypeName: "身份证",
            Mobile: "123456789000",
          },
          {
            Id: "p2",
            Key: "k2",
            Name: "申晓杰",
            Mobile: "13800138000",
            HideCredentialsNumber: "EB68***94",
            CredentialsType: 2,
          },
        ],
        OrderTravels: [
          {
            Key: "k1",
            CostCenterName: "默认",
            OrganizationCode: "A001",
            OrganizationName: "技术部",
          },
        ],
      },
      TravelPayType: "个付",
      Histories: [
        {
          StatusName: "已通过",
          Account: { RealName: "审批人甲" },
          Variables: JSON.stringify({ TypeName: "一级审批" }),
        },
      ],
    });

    expect(detail.ProductType).toBe("Flight");
    expect(detail.Tickets).toHaveLength(2);
    expect(detail.Tickets?.[0]?.Id).toBe("T2");
    expect(detail.Tickets?.[0]?.Traveler?.Name).toBe("申晓杰");
    expect(detail.Tickets?.[0]?.Traveler?.CredentialType).toBe("护照");
    expect(detail.Tickets?.[0]?.Traveler?.CredentialNumber).toBe("EB68***94");
    expect(detail.Tickets?.[1]?.Traveler?.Name).toBe("郭某某");
    expect(detail.Tickets?.[0]?.Trips[0]?.FlightNumber).toBe("KN5955");
    expect(detail.PayHoldMinutes).toBe(8);
    expect(detail.Actions?.showPay).toBe(true);
    expect(detail.Actions?.showCancel).toBe(true);
    expect(detail.Histories).toHaveLength(1);
  });

  it("maps airline fields on flight trips including ticket fallbacks", () => {
    const detail = normalizeFlightOrderDetail({
      Order: {
        Id: "ORD-FLT-AIR",
        OrderFlightTickets: [
          {
            Id: "T1",
            Key: "k1",
            AirlineName: "中国国航",
            CodeShareNumber: "CA1915",
            PlaneTypeDescribe: "空客321 (中)",
            OrderFlightTrips: [
              {
                FlightNumber: "KN5955",
                PlaneType: "73E",
                Airline: "KN",
              },
            ],
          },
        ],
      },
    });

    expect(detail.Tickets?.[0]?.Trips[0]).toMatchObject({
      FlightNumber: "KN5955",
      CodeShareNumber: "CA1915",
      AirlineName: "中国国航",
      Airline: "KN",
      PlaneType: "73E",
      PlaneTypeDescribe: "空客321 (中)",
    });
  });

  it("maps cabin type name from numeric CabinType on flight trips", () => {
    const detail = normalizeFlightOrderDetail({
      Order: {
        Id: "ORD-FLT-CABIN",
        OrderFlightTickets: [
          {
            Id: "T1",
            Key: "k1",
            OrderFlightTrips: [
              {
                FlightNumber: "MU5101",
                PlaneType: "324",
                CabinType: 1,
                FromCityName: "上海",
                ToCityName: "北京",
              },
            ],
          },
        ],
      },
    });

    expect(detail.Tickets?.[0]?.Trips[0]).toMatchObject({
      PlaneType: "324",
      CabinType: "经济舱",
      IsTransfer: false,
    });
  });

  it("maps order linkmans to contact", () => {
    const detail = normalizeFlightOrderDetail({
      Order: {
        Id: "ORD-FLT-LINK",
        OrderFlightTickets: [
          {
            Id: "T1",
            Key: "k1",
            OrderFlightTrips: [
              { FlightNumber: "MU5101", FromCityName: "上海", ToCityName: "北京" },
            ],
          },
        ],
        OrderLinkmans: [{ Name: "申/晓杰", Mobile: "19528280621", Email: "test@example.com" }],
      },
    });

    expect(detail.Contact).toEqual({
      Name: "申晓杰",
      Mobile: "19528280621",
      Email: "test@example.com",
    });
  });

  it("hides pay for company travel pay type", () => {
    const detail = normalizeFlightOrderDetail({
      Order: {
        Id: "ORD-FLT-CO",
        Variables: JSON.stringify({ OrderPayHoldTime: 10, TravelPayType: 1 }),
        OrderFlightTickets: [
          {
            Id: "T1",
            Key: "k1",
            StatusName: "预订成功",
            OrderFlightTrips: [
              { FlightNumber: "MU5101", FromCityName: "上海", ToCityName: "北京" },
            ],
          },
        ],
      },
      TravelPayType: "公付",
    });

    expect(detail.Actions?.showPay).toBe(false);
    expect(detail.Actions?.showCancel).toBe(true);
  });
});

describe("shouldNormalizeFlightDetail", () => {
  it("detects flight from OrderFlightTickets", () => {
    const payload = {
      Order: {
        Id: "ORD-FLT-001",
        OrderFlightTickets: [{ Id: "T1", Key: "k1", OrderFlightTrips: [{}] }],
      },
    };
    expect(shouldNormalizeFlightDetail(payload)).toBe(true);
    expect(shouldNormalizeHotelDetail(payload)).toBe(false);
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

describe("normalizeTrainOrderDetail", () => {
  it("maps legacy train order with multi-passenger tickets and pay actions", () => {
    const detail = normalizeTrainOrderDetail({
      Order: {
        Id: "ORD-TRN-001",
        Status: "WaitPay",
        StatusName: "待付款",
        TotalAmount: 476,
        InsertTime: "2026-07-01T23:23:00",
        Variables: JSON.stringify({
          OrderPayHoldTime: 8,
          isPay: true,
          isShowCancelButton: true,
          TravelPayType: 2,
        }),
        OrderTrainTickets: [
          {
            Id: "207600000001",
            Key: "train-key-1",
            StatusName: "待出票",
            Passenger: { Id: "p1", Name: "郭某某", PassengerTypeName: "成人" },
            OrderTrainTrips: [
              {
                TrainCode: "D79",
                FromStationName: "北京南",
                ToStationName: "上海虹桥",
                StartTime: "2026-06-27T00:10:00",
                ArrivalTime: "2026-06-27T11:30:00",
                RunTime: "11h20m",
                SeatTypeName: "二等座",
                Price: 233,
              },
            ],
          },
          {
            Id: "207600000002",
            Key: "train-key-2",
            StatusName: "待出票",
            Passenger: { Id: "p2", Name: "申晓杰", PassengerTypeName: "成人" },
            OrderTrainTrips: [
              {
                TrainCode: "D7889",
                FromStationName: "北京南",
                ToStationName: "上海虹桥",
                StartTime: "2026-06-27T00:10:00",
                ArrivalTime: "2026-06-27T11:30:00",
                SeatTypeName: "二等座",
                Price: 253,
              },
            ],
          },
        ],
        OrderPassengers: [
          { Id: "p1", Key: "train-key-1", Name: "郭某某", PassengerTypeName: "成人" },
          { Id: "p2", Key: "train-key-2", Name: "申晓杰", PassengerTypeName: "成人" },
        ],
        OrderTravels: [
          { Key: "train-key-1", CostCenterName: "默认", OrganizationName: "技术部" },
          { Key: "train-key-2", CostCenterName: "默认", OrganizationName: "技术部" },
        ],
        OrderItems: [
          { Key: "train-key-1", Tag: "Train", Name: "火车票票价", Amount: 233 },
          { Key: "train-key-2", Tag: "Train", Name: "火车票票价", Amount: 253 },
        ],
      },
      TravelPayType: "个付",
    });

    expect(detail.ProductType).toBe("Train");
    expect(detail.Tickets).toHaveLength(2);
    expect(detail.PassengerNames).toBe("申晓杰、郭某某");
    expect(detail.Actions?.showPay).toBe(true);
    expect(detail.Actions?.showCancel).toBe(true);
    expect(detail.Tickets?.[0]?.Trips[0]?.TrainCode).toBe("D7889");
  });

  it("prefers AppStatusName for ticket display status", () => {
    const detail = normalizeTrainOrderDetail({
      Order: {
        Id: "ORD-TRN-app-status",
        OrderTrainTickets: [
          {
            Id: "207600000001",
            Key: "train-key-1",
            StatusName: "预订成功",
            AppStatusName: "待出票",
            Passenger: { Id: "p1", Name: "郭某某" },
            OrderTrainTrips: [
              {
                TrainCode: "D79",
                FromStationName: "北京南",
                ToStationName: "上海虹桥",
              },
            ],
          },
        ],
      },
    });

    expect(detail.Tickets?.[0]?.AppStatusName).toBe("待出票");
    expect(detail.Tickets?.[0]?.StatusName).toBe("预订成功");
    expect(detail.TicketStatusName).toBe("待出票");
  });

  it("maps traveler credential type including id card", () => {
    const detail = normalizeTrainOrderDetail({
      Order: {
        Id: "ORD-TRN-credential",
        OrderTrainTickets: [
          {
            Id: "207600000002",
            Key: "train-key-2",
            Passenger: { Id: "train-passenger-2", Name: "申晓杰" },
            OrderTrainTrips: [
              {
                TrainCode: "D7889",
                FromStationName: "北京南",
                ToStationName: "上海虹桥",
              },
            ],
          },
        ],
        OrderPassengers: [
          {
            Id: "train-passenger-2",
            Key: "train-key-2",
            Name: "申晓杰",
            HideCredentialsNumber: "410928********5121",
            CredentialsTypeName: "身份证",
          },
        ],
      },
    });

    expect(detail.Tickets?.[0]?.Traveler?.CredentialNumber).toBe("410928********5121");
    expect(detail.Tickets?.[0]?.Traveler?.CredentialType).toBe("身份证");
  });

  it("infers id card label when credential type code is invalid", () => {
    const detail = normalizeTrainOrderDetail({
      Order: {
        Id: "ORD-TRN-credential-zero",
        OrderTrainTickets: [
          {
            Id: "207600000002",
            Key: "train-key-2",
            Passenger: {
              Id: "train-passenger-2",
              Name: "申晓杰",
              HideCredentialsNumber: "410928********5121",
              CredentialsType: 0,
            },
            OrderTrainTrips: [
              {
                TrainCode: "D7889",
                FromStationName: "北京南",
                ToStationName: "上海虹桥",
              },
            ],
          },
        ],
        OrderPassengers: [
          {
            Id: "train-passenger-2",
            Key: "train-key-2",
            Name: "申晓杰",
            HideCredentialsNumber: "410928********5121",
            CredentialsType: 0,
          },
        ],
      },
    });

    expect(detail.Tickets?.[0]?.Traveler?.CredentialNumber).toBe("410928********5121");
    expect(detail.Tickets?.[0]?.Traveler?.CredentialType).toBe("身份证");
  });

  it("infers id card type from masked credential number", () => {
    const detail = normalizeTrainOrderDetail({
      Order: {
        Id: "ORD-TRN-credential-infer",
        OrderTrainTickets: [
          {
            Id: "207600000002",
            Key: "train-key-2",
            Passenger: {
              Name: "申晓杰",
              HideCredentialsNumber: "410928********5121",
              CredentialsType: 0,
            },
            OrderTrainTrips: [
              {
                TrainCode: "D7889",
                FromStationName: "北京南",
                ToStationName: "上海虹桥",
              },
            ],
          },
        ],
      },
    });

    expect(detail.Tickets?.[0]?.Traveler?.CredentialType).toBe("身份证");
  });

  it("maps pending issue actions", () => {
    const detail = normalizeTrainOrderDetail({
      Order: {
        Id: "ORD-TRN-pending-issue",
        Status: "WaitIssue",
        StatusName: "待出票",
        Variables: JSON.stringify({
          OrderPayHoldTime: 6,
          isShowCancelButton: true,
          isShowIssueButton: true,
          TravelPayType: 1,
        }),
        OrderTrainTickets: [
          {
            Id: "207600000001",
            Key: "train-key-1",
            StatusName: "待出票",
            Passenger: { Name: "申晓杰" },
            OrderTrainTrips: [
              {
                TrainCode: "D79",
                FromStationName: "北京南",
                ToStationName: "上海虹桥",
                CoachNo: "06",
                SeatNo: "001A",
              },
            ],
          },
        ],
      },
      TravelPayType: "公付",
    });

    expect(detail.Actions?.showIssue).toBe(true);
    expect(detail.Actions?.showPay).toBe(false);
    expect(detail.Tickets?.[0]?.Trips[0]?.CoachNo).toBe("06");
  });

  it("shows issue actions when ticket AppStatusName is pending issue", () => {
    const detail = normalizeTrainOrderDetail({
      Order: {
        Id: "ORD-TRN-app-status-issue",
        Status: "WaitIssue",
        StatusName: "待出票",
        Variables: JSON.stringify({ isShowCancelButton: true }),
        OrderTrainTickets: [
          {
            Id: "207600000001",
            Key: "train-key-1",
            StatusName: "预订成功",
            AppStatusName: "待出票",
            Passenger: { Name: "申晓杰" },
            OrderTrainTrips: [
              {
                TrainCode: "D79",
                FromStationName: "北京南",
                ToStationName: "上海虹桥",
              },
            ],
          },
        ],
      },
    });

    expect(detail.Actions?.showIssue).toBe(true);
    expect(detail.Actions?.showCancel).toBe(true);
    expect(detail.Actions?.showPay).toBe(false);
  });

  it("maps ticket-level seat fields from legacy OrderTrainTicket", () => {
    const detail = normalizeTrainOrderDetail({
      Order: {
        Id: "ORD-TRN-issued",
        OrderTrainTickets: [
          {
            Id: "20760000000198",
            Key: "train-key-1",
            StatusName: "废除",
            SeatType: 10,
            SeatTypeName: "二等座",
            Detail: "06车01A号",
            Passenger: { Name: "测试" },
            OrderTrainTrips: [
              {
                TrainCode: "D79",
                FromStationName: "北京南",
                ToStationName: "上海虹桥",
                StartTime: "2026-06-27T00:10:00",
                ArrivalTime: "2026-06-27T11:30:00",
              },
            ],
          },
        ],
      },
    });

    const ticket = detail.Tickets?.[0];
    expect(ticket?.SeatTypeName).toBe("二等座");
    expect(ticket?.Detail).toBe("06车01A号");
    expect(ticket?.Trips[0]?.SeatTypeName).toBe("二等座");
    expect(ticket?.Trips[0]?.SeatName).toBe("06车01A号");
  });

  it("maps TravelMinutes to RunTime on train trips", () => {
    const detail = normalizeTrainOrderDetail({
      Order: {
        Id: "ORD-TRN-duration",
        OrderTrainTickets: [
          {
            Id: "1",
            Key: "k1",
            Passenger: { Name: "测试" },
            OrderTrainTrips: [
              {
                TrainCode: "D79",
                FromStationName: "北京南",
                ToStationName: "上海虹桥",
                TravelMinutes: "680",
              },
            ],
          },
        ],
      },
    });

    expect(detail.Tickets?.[0]?.Trips[0]?.RunTime).toBe("11时20分");
  });

  it("maps ticket-level refund and exchange actions from Variables", () => {
    const detail = normalizeTrainOrderDetail({
      Order: {
        Id: "ORD-TRN-002",
        Status: "WaitTravel",
        StatusName: "待出行",
        TotalAmount: 238,
        OrderTrainTickets: [
          {
            Id: "207600000001",
            Key: "train-key-1",
            StatusName: "已出票",
            Variables: JSON.stringify({
              isShowRefundButton: true,
              isShowExchangeButton: true,
            }),
            OrderTrainTrips: [
              {
                TrainCode: "D79",
                FromStationName: "北京南",
                ToStationName: "上海虹桥",
                StartTime: "2026-06-27T00:10:00",
              },
            ],
          },
        ],
      },
      Tmc: { IsShowServiceFee: false },
    });

    expect(detail.ShowServiceFee).toBe(false);
    expect(detail.Tickets?.[0]?.Actions).toEqual({
      showRefund: true,
      showExchange: true,
    });
    expect(detail.Tickets?.[0]?.Traveler?.OutNumbers).toBeUndefined();
  });

  it("maps out numbers from OrderNumbers for train tickets", () => {
    const detail = normalizeTrainOrderDetail({
      Order: {
        Id: "ORD-TRN-OUT",
        OrderTrainTickets: [
          {
            Id: "ticket-1",
            Key: "train-key-1",
            Passenger: { Name: "孙雪" },
            OrderTrainTrips: [
              { TrainCode: "G1", FromStationName: "北京南", ToStationName: "上海虹桥" },
            ],
          },
        ],
        OrderNumbers: [
          { Tag: "TmcOutNumber", Key: "train-key-1", Name: "出差单号", Number: "TR20260001" },
        ],
      },
    });

    expect(detail.Tickets?.[0]?.Traveler?.OutNumbers).toBe("出差单号:TR20260001");
  });
});

describe("shouldNormalizeTrainDetail", () => {
  it("detects train from OrderTrainTickets", () => {
    const payload = {
      Order: {
        Id: "ORD-TRN-001",
        OrderTrainTickets: [{ Id: "T1", Key: "k1", OrderTrainTrips: [{}] }],
      },
    };
    expect(shouldNormalizeTrainDetail(payload)).toBe(true);
    expect(shouldNormalizeFlightDetail(payload)).toBe(false);
  });
});
