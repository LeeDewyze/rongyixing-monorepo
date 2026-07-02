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
          Train: { TrainNo: "G1", BookSeatType: 10, BookSeatLocation: "" },
        },
      ],
    });

    expect(result).not.toHaveProperty("Channel");
    expect(result.Passengers[0]).toEqual({
      ClientId: "passenger-1",
      Train: { TrainNo: "G1", BookSeatType: 10, BookSeatLocation: "" },
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
  it("zeros passenger TravelPayType and swaps Seats with OriginalSearchResultSeats", () => {
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
    expect(result.Passengers[0]?.Train).not.toHaveProperty("OriginalSearchResultSeats");
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
});
