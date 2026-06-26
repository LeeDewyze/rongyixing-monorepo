import { describe, expect, it } from "vitest";
import { TrainSeatType } from "@ryx/shared-types";

import {
  canSelectTrainSeat,
  buildTrainInitBookDto,
  buildTrainOrderBookDto,
  createTrainPassengerBookForm,
  resolveTrainBookBillBreakdown,
  validateTrainBookForms,
} from "./train-book";
import type { TrainBookSelection } from "./train-book-session";

describe("canSelectTrainSeat", () => {
  it("allows G/D seat classes only", () => {
    expect(canSelectTrainSeat(TrainSeatType.SecondClassSeat)).toBe(true);
    expect(canSelectTrainSeat(TrainSeatType.FirstClassSeat)).toBe(true);
    expect(canSelectTrainSeat(TrainSeatType.BusinessSeat)).toBe(true);
    expect(canSelectTrainSeat(TrainSeatType.SpecialSeat)).toBe(true);
    expect(canSelectTrainSeat(TrainSeatType.HardSeat)).toBe(false);
    expect(canSelectTrainSeat(TrainSeatType.SoftBerth)).toBe(false);
  });
});

describe("buildTrainInitBookDto", () => {
  const selection: TrainBookSelection = {
    searchParams: {
      Date: "2025-06-26",
      FromStation: "BJP",
      ToStation: "SHH",
    },
    train: {
      Id: "g1",
      TrainNo: "G1",
      TrainCode: "G1",
      StartTime: "2025-06-26 09:00",
      ArrivalTime: "2025-06-26 13:28",
      FromStation: "北京",
      ToStation: "上海",
      Seats: [{ SeatType: TrainSeatType.SecondClassSeat, SeatTypeName: "二等座", Price: 553 }],
    },
    seat: { SeatType: TrainSeatType.SecondClassSeat, SeatTypeName: "二等座", Price: 553 },
    selectedAt: Date.now(),
    passengers: [],
  };

  const passengers = [
    {
      id: "p1",
      passenger: { Id: "p1", AccountId: "acc-1", Name: "Test" },
      credential: { Id: "c1", Name: "Test", AccountId: "acc-1", Mobile: "13800000000" },
    },
  ] as const;

  it("includes BookSeatType and empty BookSeatLocation on Initialize", () => {
    const dto = buildTrainInitBookDto({ selection, passengers: passengers as never });
    const train = dto.Passengers[0]?.Train;
    expect(dto.Passengers[0]?.ClientId).toBe("p1");
    expect(train?.BookSeatType).toBe(TrainSeatType.SecondClassSeat);
    expect(train?.BookSeatLocation).toBe("");
    expect(train?.Seats?.[0]?.SeatTypeName).toBe("二等座");
    expect(train?.OriginalSearchResultSeats?.[0]?.SeatTypeName).toBe("二等座");
  });
});

describe("buildTrainOrderBookDto seat preferences", () => {
  const selection: TrainBookSelection = {
    searchParams: {
      Date: "2025-06-26",
      FromStation: "BJP",
      ToStation: "SHH",
    },
    train: {
      Id: "g1",
      TrainNo: "G1",
      TrainCode: "G1",
      StartTime: "2025-06-26 09:00",
      ArrivalTime: "2025-06-26 13:28",
      FromStation: "北京",
      ToStation: "上海",
      Seats: [{ SeatType: TrainSeatType.SecondClassSeat, SeatTypeName: "二等座", Price: 553 }],
    },
    seat: { SeatType: TrainSeatType.SecondClassSeat, SeatTypeName: "二等座", Price: 553 },
    selectedAt: Date.now(),
    passengers: [],
  };

  const passengers = [
    {
      id: "p1",
      passenger: { Id: "p1", AccountId: "acc-1", Name: "Passenger One" },
      credential: { Id: "c1", Name: "Passenger One", AccountId: "acc-1", Mobile: "13800000001" },
    },
    {
      id: "p2",
      passenger: { Id: "p2", AccountId: "acc-2", Name: "Passenger Two" },
      credential: { Id: "c2", Name: "Passenger Two", AccountId: "acc-2", Mobile: "13800000002" },
    },
  ] as const;

  it("maps each selected seat preference to the matching passenger", () => {
    const dto = buildTrainOrderBookDto({
      selection,
      passengers: passengers as never,
      bookSeatLocations: ["A", "C"],
    });

    expect(dto.Passengers[0]?.Train?.BookSeatLocation).toBe("1A");
    expect(dto.Passengers[1]?.Train?.BookSeatLocation).toBe("1C");
  });

  it("applies order-level notify language to every passenger", () => {
    const dto = buildTrainOrderBookDto({
      selection,
      passengers: passengers as never,
      globalNotifyLanguage: "en",
    });

    expect(dto.Passengers[0]?.MessageLang).toBe("en");
    expect(dto.Passengers[1]?.MessageLang).toBe("en");
  });
});

describe("resolveTrainBookBillBreakdown", () => {
  const selection: TrainBookSelection = {
    searchParams: {
      Date: "2025-06-26",
      FromStation: "BJP",
      ToStation: "SHH",
    },
    train: {
      Id: "g1",
      TrainNo: "G1",
      TrainCode: "G1",
      StartTime: "2025-06-26 09:00",
      ArrivalTime: "2025-06-26 13:28",
      FromStation: "北京",
      ToStation: "上海",
      Seats: [{ SeatType: TrainSeatType.SecondClassSeat, SeatTypeName: "二等座", Price: 553 }],
    },
    seat: { SeatType: TrainSeatType.SecondClassSeat, SeatTypeName: "二等座", Price: 553 },
    selectedAt: Date.now(),
    passengers: [],
  };

  const passengers = [
    {
      id: "p1",
      passenger: { Id: "p1", AccountId: "acc-1", Name: "Passenger One" },
      credential: { Id: "c1", Name: "Passenger One", AccountId: "acc-1", Mobile: "13800000001" },
    },
    {
      id: "p2",
      passenger: { Id: "p2", AccountId: "acc-2", Name: "Passenger Two" },
      credential: { Id: "c2", Name: "Passenger Two", AccountId: "acc-2", Mobile: "13800000002" },
    },
  ] as const;

  it("sums ticket price and service fee per passenger", () => {
    const breakdown = resolveTrainBookBillBreakdown({
      selection,
      passengers: passengers as never,
      serviceFees: { "acc-1": 10, "acc-2": 20 },
    });

    expect(breakdown.passengers).toHaveLength(2);
    expect(breakdown.passengers[0]?.subtotal).toBe(563);
    expect(breakdown.passengers[1]?.subtotal).toBe(573);
    expect(breakdown.total).toBe(1136);
    expect(breakdown.passengers[0]?.trainRouteLabel).toBe("G1北京--上海");
  });
});

describe("validateTrainBookForms", () => {
  const passengers = [
    {
      id: "p1",
      passenger: { Id: "p1", AccountId: "acc-1", Name: "Passenger One", Mobile: "13800000001" },
      credential: { Id: "c1", Name: "Passenger One", AccountId: "acc-1", Mobile: "13800000001" },
    },
  ] as const;

  it("passes when mobile is available and no policy violation", () => {
    const forms = {
      p1: createTrainPassengerBookForm(passengers[0] as never),
    };
    expect(
      validateTrainBookForms({
        passengers: passengers as never,
        forms,
        outNumberFieldsByPassenger: { p1: [] },
        authorizedContacts: [],
        requireIllegalReason: false,
      }),
    ).toBeNull();
  });

  it("does not require illegal reason when only init provides reason options", () => {
    const forms = {
      p1: createTrainPassengerBookForm(passengers[0] as never),
    };
    expect(
      validateTrainBookForms({
        passengers: passengers as never,
        forms,
        outNumberFieldsByPassenger: { p1: [] },
        authorizedContacts: [],
        staffs: [{ Id: "acc-1", Name: "Passenger One", isAllowSelectApprove: false }],
        requireIllegalReason: false,
      }),
    ).toBeNull();
  });
});
