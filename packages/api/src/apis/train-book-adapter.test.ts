import { describe, expect, it } from "vitest";

import {
  formatBookSeatLocation,
  prepareTrainBookSubmitDto,
  sanitizeTrainPolicyForWire,
  stripStaffTravelPolicyForWire,
  stripTrainBookOrderDto,
  stripTrainInitBookDto,
} from "./train-book-adapter.js";

describe("formatBookSeatLocation", () => {
  it("keeps legacy row-prefixed seat locations and prefixes bare seat letters", () => {
    expect(formatBookSeatLocation("1A")).toBe("1A");
    expect(formatBookSeatLocation("2f")).toBe("2F");
    expect(formatBookSeatLocation("C")).toBe("1C");
  });
});

describe("sanitizeTrainPolicyForWire", () => {
  it("keeps server policy fields and drops client-only color", () => {
    const result = sanitizeTrainPolicyForWire({
      TrainNo: "G123",
      SeatType: 10,
      IsAllowBook: true,
      Rules: ["rule-a"],
      Descriptions: ["desc"],
      color: "success",
    });

    expect(result).toMatchObject({
      TrainNo: "G123",
      SeatType: 10,
      IsAllowBook: true,
      Rules: ["rule-a"],
      Descriptions: ["desc"],
      TrainDescription: null,
    });
    expect(result).not.toHaveProperty("color");
  });
});

describe("stripStaffTravelPolicyForWire", () => {
  it("spreads staff policy and nulls description fields", () => {
    const result = stripStaffTravelPolicyForWire({
      Name: "主要负责人",
      TrainType: 3,
      FlightDescription: "hidden",
      TrainDescription: "hidden",
    });

    expect(result).toMatchObject({
      Name: "主要负责人",
      TrainType: 3,
      FlightDescription: null,
      TrainDescription: null,
    });
  });
});

describe("stripTrainInitBookDto", () => {
  it("keeps OriginalSearchResultSeats and swaps seat color only", () => {
    const originalSeats = [{ SeatType: 1, SeatTypeName: "硬座", Price: 189 }];
    const displaySeats = [
      {
        SeatType: 1,
        SeatTypeName: "硬座上",
        Price: 189,
        color: "success",
        Policy: { TrainNo: "K1", SeatType: 1, IsAllowBook: true },
      },
    ];

    const result = stripTrainInitBookDto({
      channel: "tourist",
      Passengers: [
        {
          ClientId: "passenger-1",
          TravelPayType: 2,
          Policy: { Name: "主要负责人", TrainDescription: "x" },
          Train: {
            TrainNo: "K1999",
            Seats: displaySeats,
            OriginalSearchResultSeats: originalSeats,
          },
        },
      ],
    });

    expect(result.TravelFormId).toBe("");
    expect(result.Passengers[0]?.TravelPayType).toBeUndefined();
    expect(result.Passengers[0]?.Train?.Seats).toEqual([
      {
        SeatType: 1,
        SeatTypeName: "硬座上",
        Price: 189,
        color: "success",
        Policy: {
          TrainNo: "K1",
          SeatType: 1,
          IsAllowBook: true,
          FlightDescription: null,
          TrainDescription: null,
          TrainSeatType: null,
          TrainSeatTypeName: null,
          TrainUpperSeatType: null,
          TrainUpperSeatTypeArray: null,
          TrainUpperSeatTypeName: null,
          HotelDescription: null,
          Setting: null,
        },
      },
    ]);
    expect(result.Passengers[0]?.Train?.OriginalSearchResultSeats).toEqual(originalSeats);
    expect(result.Passengers[0]?.Policy).toBeUndefined();
  });

  it("strips init passenger fields down to ClientId and Train", () => {
    const result = stripTrainInitBookDto({
      channel: "tourist",
      Channel: "客户H5",
      Passengers: [
        {
          ClientId: "passenger-1",
          TravelPayType: 2,
          Mobile: "13800000000",
          Credentials: { Id: "c1", Name: "张三" },
          Policy: { Name: "主要负责人" },
          Train: {
            TrainNo: "G1",
            BookSeatType: 10,
            BookSeatLocation: "",
            FromCityName: "北京",
            ToCityName: "上海",
            Key: "anti-tamper-key",
          },
        },
      ],
    });

    expect(result).not.toHaveProperty("Channel");
    expect(result.Passengers[0]).toEqual({
      ClientId: "passenger-1",
      Train: {
        TrainNo: "G1",
        BookSeatType: 10,
        BookSeatLocation: "",
        Key: "anti-tamper-key",
      },
    });
  });

  it("keeps business init passenger metadata when TravelFormId is present", () => {
    const result = stripTrainInitBookDto({
      channel: "tmc",
      TravelFormId: "tf-001",
      Passengers: [
        {
          ClientId: "passenger-1",
          TravelPayType: 2,
          Mobile: "13800000000",
          Credentials: { Id: "c1", Name: "张三" },
          Policy: { Name: "主要负责人" },
          Train: { TrainNo: "G1", BookSeatType: 10, BookSeatLocation: "" },
        },
      ],
    });

    expect(result.TravelFormId).toBe("tf-001");
    expect(result.Passengers[0]?.TravelPayType).toBe(0);
    expect(result.Passengers[0]?.Mobile).toBe("13800000000");
    expect(result.Passengers[0]?.Credentials).toEqual({ Id: "c1", Name: "张三" });
    expect(result.Passengers[0]?.Policy).toMatchObject({
      Name: "主要负责人",
      TrainDescription: null,
    });
  });

  it("keeps business init passenger metadata even without TravelFormId", () => {
    const result = stripTrainInitBookDto({
      channel: "tmc",
      Passengers: [
        {
          ClientId: "passenger-1",
          Mobile: "13800000000",
          Credentials: { Id: "c1", Name: "张三" },
          Train: { TrainNo: "G1", BookSeatType: 10, BookSeatLocation: "" },
        },
      ],
    });

    expect(result.TravelFormId).toBe("");
    expect(result.Passengers[0]?.Mobile).toBe("13800000000");
    expect(result.Passengers[0]?.Credentials).toEqual({ Id: "c1", Name: "张三" });
  });
});

describe("stripTrainBookOrderDto", () => {
  it("zeros passenger TravelPayType and sends original search seats as Book Seats", () => {
    const originalSeats = [{ SeatType: 1, SeatTypeName: "硬座", Price: 189 }];
    const displaySeats = [{ SeatType: 1, SeatTypeName: "硬座上", Price: 189 }];

    const result = stripTrainBookOrderDto({
      TravelPayType: 2,
      Passengers: [
        {
          ClientId: "passenger-1",
          TravelPayType: 2,
          Train: {
            TrainNo: "K1999",
            Seats: displaySeats,
            OriginalSearchResultSeats: originalSeats,
          },
        },
      ],
    });

    expect(result.TravelPayType).toBe(2);
    expect(result.Passengers[0]?.TravelPayType).toBe(0);
    expect(result.Passengers[0]?.Train?.Seats).toEqual(originalSeats);
    expect(result.Passengers[0]?.Train?.OriginalSearchResultSeats).toEqual(originalSeats);
  });
});

describe("prepareTrainBookSubmitDto", () => {
  it("defaults ApprovalId, omits empty OutNumbers, and clears AccountNumber for direct book", () => {
    const result = prepareTrainBookSubmitDto({
      IsOfficialBooked: false,
      AccountNumber: "should-remove",
      Linkmans: [],
      Passengers: [
        {
          ClientId: "passenger-1",
          ApprovalId: "",
          OutNumbers: null,
          Train: { TrainNo: "G1", BookSeatLocation: "  " },
        },
      ],
    });

    expect(result.AccountNumber).toBeUndefined();
    expect(result.Linkmans).toBeUndefined();
    expect(result.Passengers[0]?.ApprovalId).toBe("0");
    expect(result.Passengers[0]?.OutNumbers).toBeUndefined();
    expect(result.Passengers[0]?.Train?.BookSeatLocation).toBeUndefined();
  });

  it("keeps AccountNumber for official 12306 book", () => {
    const result = prepareTrainBookSubmitDto({
      IsOfficialBooked: true,
      AccountNumber: "user@12306",
      Passengers: [{ ClientId: "passenger-1" }],
    });

    expect(result.AccountNumber).toBe("user@12306");
  });

  it("strips business-only fields from tourist train book payload", () => {
    const originalSeats = [{ SeatType: 10, SeatTypeName: "二等座", Price: 553 }];
    const displaySeats = [{ SeatType: 10, SeatTypeName: "二等座", Price: 553 }];

    const result = prepareTrainBookSubmitDto({
      channel: "tourist",
      TravelFormId: "tf-001",
      AgentId: "agent-1",
      Channel: "客户H5",
      TravelPayType: 2,
      IsOfficialBooked: false,
      AccountNumber: "should-remove",
      Linkmans: [
        {
          Id: "authorized-account",
          Name: "订单联系人",
          Mobile: "13800000000",
          Email: "contact@example.com",
        },
      ],
      Passengers: [
        {
          ClientId: "passenger-1",
          Mobile: "13800000001",
          Email: "p1@example.com",
          MessageLang: "cn",
          Credentials: {
            Id: "c1",
            Name: "张三",
            Type: 1,
            CredentialsType: 1,
            Gender: "M",
            Number: "110101199001010000",
            Surname: "张",
            Givenname: "三",
            Mobile: "13800000001",
            Policy: { Name: "主要负责人" },
          } as never,
          Train: {
            TrainNo: "G1",
            BookSeatType: 10,
            BookSeatLocation: "",
            FromCityName: "北京",
            ToCityName: "上海",
            Key: "anti-tamper-key",
            TrainSecrets: "anti-tamper-secrets",
            Seats: displaySeats,
            OriginalSearchResultSeats: originalSeats,
            InsuranceProducts: [],
          },
          Policy: { Name: "主要负责人" },
          IllegalPolicy: "违反座位类型",
          IllegalReason: "reason",
          ExpenseType: "expense",
          ApprovalId: "approval-1",
          IsSkipApprove: true,
          TravelPayType: 0,
          TravelType: 2,
          travelFormId: "tf-001",
          travelNumber: "TN-001",
          CostCenterCode: "CC",
          CostCenterName: "成本中心",
          OrganizationCode: "ORG",
          OrganizationName: "组织",
          OutNumbers: { TravelNumber: "TN-001" },
        },
      ],
    });

    const passenger = result.Passengers[0] as Record<string, unknown>;
    const credentials = passenger.Credentials as Record<string, unknown>;

    expect(result.TravelFormId).toBeUndefined();
    expect(result.AgentId).toBe("agent-1");
    expect(result.AccountNumber).toBeUndefined();
    expect(result.TravelPayType).toBeUndefined();
    expect(result.IsFromOffline).toBe(false);
    expect(result.Linkmans).toEqual([
      {
        Name: "订单联系人",
        Mobile: "13800000000",
        Email: "contact@example.com",
      },
    ]);
    expect(passenger.ClientId).toBeUndefined();
    expect(passenger.MessageLang).toBe("cn");
    expect(passenger.CardName).toBe("");
    expect(passenger.CardNumber).toBe("");
    expect(passenger.TicketNum).toBe("");
    expect(passenger.Policy).toBeUndefined();
    expect(passenger.IllegalPolicy).toBe("违反座位类型");
    expect(passenger.IllegalReason).toBeUndefined();
    expect(passenger.ExpenseType).toBeUndefined();
    expect(passenger.ApprovalId).toBeUndefined();
    expect(passenger.IsSkipApprove).toBeUndefined();
    expect(passenger.TravelPayType).toBeUndefined();
    expect(passenger.TravelType).toBeUndefined();
    expect(passenger.travelFormId).toBeUndefined();
    expect(passenger.travelNumber).toBeUndefined();
    expect(passenger.CostCenterCode).toBeUndefined();
    expect(passenger.CostCenterName).toBeUndefined();
    expect(passenger.OrganizationCode).toBeUndefined();
    expect(passenger.OrganizationName).toBeUndefined();
    expect(passenger.OutNumbers).toBeUndefined();
    expect(credentials).toEqual({
      Type: 1,
      Gender: "M",
      Number: "110101199001010000",
      Surname: "张",
      Givenname: "三",
    });
    expect(result.Passengers[0]?.Train?.Seats).toEqual(originalSeats);
    expect(result.Passengers[0]?.Train?.OriginalSearchResultSeats).toEqual(originalSeats);
    expect(result.Passengers[0]?.Train?.InsuranceProducts).toEqual([]);
    expect(result.Passengers[0]?.Train).not.toHaveProperty("FromCityName");
    expect(result.Passengers[0]?.Train).not.toHaveProperty("ToCityName");
    expect(result.Passengers[0]?.Train).toMatchObject({
      Key: "anti-tamper-key",
      TrainSecrets: "anti-tamper-secrets",
    });
  });

  it("derives tourist credential surname and givenname from Name when missing", () => {
    const result = prepareTrainBookSubmitDto({
      channel: "tourist",
      Passengers: [
        {
          ClientId: "passenger-1",
          Mobile: "13800000001",
          Credentials: {
            Type: 1,
            Name: "申晓杰",
            Number: "410928199608225121",
          },
        },
      ],
    });

    expect(result.Passengers[0]?.Credentials).toEqual({
      Type: 1,
      Number: "410928199608225121",
      Surname: "申",
      Givenname: "晓杰",
    });
  });

  it("keeps TicketId on tourist train exchange initialize payload", () => {
    const result = stripTrainInitBookDto({
      channel: "tourist",
      TicketId: "ticket-1",
      Passengers: [
        {
          ClientId: "train-only",
          Train: { TrainNo: "G1" },
        },
      ],
    });

    expect(result.TicketId).toBe("ticket-1");
    expect(result.Passengers[0]).toEqual({
      ClientId: "train-only",
      Train: { TrainNo: "G1" },
    });
  });

  it("maps exchange book payload to legacy root TicketId", () => {
    const result = prepareTrainBookSubmitDto({
      TravelFormId: "tf-1",
      TravelPayType: 1,
      ExchangeTicketId: "207600000001",
      IsExchange: true,
      Passengers: [
        {
          ClientId: "p1",
          Mobile: "13800000001",
          Train: { TrainNo: "G1", BookSeatType: 4 },
          Credentials: { Id: "c1", Type: 1, Number: "410928199608225121" },
        },
      ],
    });

    expect(result.TicketId).toBe("207600000001");
    expect(result.ExchangeTicketId).toBeUndefined();
    expect(result.IsExchange).toBeUndefined();
  });
});
