import type {
  TrainBookEntityDto,
  TrainBookSeatDto,
  TrainItem,
  TrainOrderBookDto,
  TrainSeat,
  TrainSeatType,
} from "@ryx/shared-types";

const BERTH_SUFFIX_PATTERN = /[上中下]$/;

/** Strip 上/中/下 suffix from berth seat names for Policy/Book payloads. */
export function stripBerthSeatTypeName(name: string | undefined): string | undefined {
  if (!name?.trim()) return name;
  return name.replace(BERTH_SUFFIX_PATTERN, "");
}

export function buildOriginalSearchResultSeats(seats: TrainSeat[]): TrainBookSeatDto[] {
  return seats.map((seat) => ({
    SeatType: seat.SeatType,
    SeatTypeName: stripBerthSeatTypeName(seat.SeatTypeName),
    SalesPrice: seat.Price,
    TicketPrice: seat.TicketPrice ?? seat.Price,
    Price: seat.Price,
    Count: seat.Count,
    BedInfos: seat.BedInfos?.map((bed) => ({
      BedTypeName: bed.BedTypeName,
      Price: bed.Price,
      SalesPrice: bed.Price,
    })),
  }));
}

export function buildTrainPolicySeatPayload(seat: TrainSeat): TrainBookSeatDto {
  return {
    SeatType: seat.SeatType,
    SeatTypeName: stripBerthSeatTypeName(seat.SeatTypeName),
    SalesPrice: seat.Price,
    TicketPrice: seat.TicketPrice ?? seat.Price,
    Price: seat.Price,
    Count: seat.Count,
    BedInfos: seat.BedInfos,
  };
}

/** Trimmed train list JSON for Home-Policy — avoids full entity null fields. */
export function buildTrainPolicyTrainsPayload(trains: TrainItem[]): TrainBookEntityDto[] {
  return trains.map((train) => ({
    TrainNo: train.TrainNo ?? train.TrainCode,
    TrainCode: train.TrainCode,
    StartTime: train.StartTime,
    ArrivalTime: train.ArrivalTime,
    FromStation: train.FromStation,
    ToStation: train.ToStation,
    FromStationCode: train.FromStationCode,
    ToStationCode: train.ToStationCode,
    TravelTimeName: train.Duration,
    ArriveDays: train.ArriveDays,
    Seats: (train.Seats ?? []).map(buildTrainPolicySeatPayload),
  }));
}

/** Seat-level Home-Policy fields for wire payloads. */
export function sanitizeTrainPolicyForWire(
  policy: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!policy) return undefined;

  const result: Record<string, unknown> = {
    FlightDescription: null,
    TrainDescription: null,
    TrainSeatType: null,
    TrainSeatTypeName: null,
    TrainUpperSeatType: null,
    TrainUpperSeatTypeArray: null,
    TrainUpperSeatTypeName: null,
    HotelDescription: null,
    Setting: null,
  };

  if (policy.TrainNo != null) result.TrainNo = policy.TrainNo;
  if (policy.SeatType != null) result.SeatType = policy.SeatType;
  if (typeof policy.IsAllowBook === "boolean") result.IsAllowBook = policy.IsAllowBook;
  if (typeof policy.IsForceBook === "boolean") result.IsForceBook = policy.IsForceBook;
  if (Array.isArray(policy.Rules) && policy.Rules.length > 0) result.Rules = policy.Rules;
  if (Array.isArray(policy.Descriptions) && policy.Descriptions.length > 0) {
    result.Descriptions = policy.Descriptions;
  }

  return result;
}

/** Staff travel policy — legacy Initialize/Book nulls description fields but keeps the object. */
export function stripStaffTravelPolicyForWire(
  policy: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!policy) return undefined;
  return {
    ...policy,
    FlightDescription: null,
    TrainDescription: null,
    TrainSeatType: null,
    TrainSeatTypeName: null,
    TrainUpperSeatType: null,
    TrainUpperSeatTypeArray: null,
    TrainUpperSeatTypeName: null,
    HotelDescription: null,
    Setting: null,
  };
}

function stripSeatPolicyColorForInit(seat: Record<string, unknown>): Record<string, unknown> {
  const { policyColor: _policyColor, ...rest } = seat;
  const next = { ...rest };
  if (next.Policy && typeof next.Policy === "object") {
    next.Policy = sanitizeTrainPolicyForWire(next.Policy as Record<string, unknown>);
  }
  return next;
}

function stripTrainEntityForInit(
  train: TrainBookEntityDto | undefined,
): TrainBookEntityDto | undefined {
  if (!train) return train;

  const { InsuranceProducts: _insurance, Seats, ...rest } = train;
  const next: TrainBookEntityDto = { ...rest };
  if (Seats?.length) {
    next.Seats = Seats.map((seat) =>
      stripSeatPolicyColorForInit(seat as Record<string, unknown>),
    ) as TrainBookSeatDto[];
  }
  return next;
}

/** Book — swap Seats with OriginalSearchResultSeats and drop the snapshot field. */
function stripTrainEntityForBook(
  train: TrainBookEntityDto | undefined,
): TrainBookEntityDto | undefined {
  if (!train) return train;

  const wireTrain = train as TrainBookEntityDto & {
    OriginalSearchResultSeats?: TrainBookSeatDto[];
  };
  const { InsuranceProducts: _insurance, OriginalSearchResultSeats, Seats, ...rest } = wireTrain;
  const wireSeats = OriginalSearchResultSeats?.length ? OriginalSearchResultSeats : Seats;
  if (!wireSeats?.length) return rest;
  return { ...rest, Seats: wireSeats };
}

function stripCredentialsForWire(
  credentials: TrainOrderBookDto["Passengers"][number]["Credentials"],
): TrainOrderBookDto["Passengers"][number]["Credentials"] {
  if (!credentials) return credentials;
  const next = { ...credentials } as Record<string, unknown>;
  if (next.Policy && typeof next.Policy === "object") {
    next.Policy = stripStaffTravelPolicyForWire(next.Policy as Record<string, unknown>);
  }
  return next as TrainOrderBookDto["Passengers"][number]["Credentials"];
}

function stripPassengerForPersonalInit(
  passenger: TrainOrderBookDto["Passengers"][number],
): TrainOrderBookDto["Passengers"][number] {
  return {
    ClientId: passenger.ClientId,
    Train: stripTrainEntityForInit(passenger.Train),
  };
}

function stripPassengerForBusinessInit(
  passenger: TrainOrderBookDto["Passengers"][number],
): TrainOrderBookDto["Passengers"][number] {
  const next = { ...passenger, TravelPayType: 0 };
  if (next.Policy) {
    next.Policy = stripStaffTravelPolicyForWire(next.Policy as Record<string, unknown>);
  }
  if (next.Credentials) {
    next.Credentials = stripCredentialsForWire(next.Credentials);
  }
  if (next.Train) {
    next.Train = stripTrainEntityForInit(next.Train);
  }
  return next;
}

function stripPassengerForBook(
  passenger: TrainOrderBookDto["Passengers"][number],
): TrainOrderBookDto["Passengers"][number] {
  const next = { ...passenger, TravelPayType: 0 };
  if (next.Policy) {
    next.Policy = stripStaffTravelPolicyForWire(next.Policy as Record<string, unknown>);
  }
  if (next.Credentials) {
    next.Credentials = stripCredentialsForWire(next.Credentials);
  }
  if (next.Train) {
    next.Train = stripTrainEntityForBook(next.Train);
  }
  return next;
}

/** Strip heavy fields before Train-Initialize — aligned with legacy api.md. */
export function stripTrainInitBookDto(dto: TrainOrderBookDto): TrainOrderBookDto {
  const isPersonalInit = dto.channel === "tourist";
  const passengers = dto.Passengers.map(
    isPersonalInit ? stripPassengerForPersonalInit : stripPassengerForBusinessInit,
  );
  const travelFormId = dto.TravelFormId;

  const result: TrainOrderBookDto = {
    TravelFormId: travelFormId ?? "",
    Passengers: passengers,
  };
  if (dto.channel) {
    result.channel = dto.channel;
  }
  return result;
}

/** Strip heavy fields before Train-Book seat swap. */
export function stripTrainBookOrderDto(dto: TrainOrderBookDto): TrainOrderBookDto {
  const passengers = dto.Passengers.map(stripPassengerForBook);
  const travelFormId = dto.TravelFormId ?? passengers.find((p) => p.travelFormId)?.travelFormId;

  return {
    ...dto,
    TravelFormId: travelFormId,
    Passengers: passengers,
  };
}

/** @deprecated Use stripTrainInitBookDto or stripTrainBookOrderDto. */
export function stripTrainOrderBookDto(dto: TrainOrderBookDto): TrainOrderBookDto {
  return stripTrainBookOrderDto(dto);
}

/** Legacy `onBook` final transforms before Train-Book proxy send. */
export function prepareTrainBookSubmitDto(dto: TrainOrderBookDto): TrainOrderBookDto {
  const base = stripTrainBookOrderDto(dto);

  const passengers = base.Passengers.map((passenger) => {
    const next: TrainOrderBookDto["Passengers"][number] = {
      ...passenger,
      ApprovalId: passenger.ApprovalId?.trim() ? passenger.ApprovalId : "0",
    };

    if (next.OutNumbers == null || Object.keys(next.OutNumbers).length === 0) {
      delete next.OutNumbers;
    }

    if (next.Train) {
      const train = { ...next.Train };
      if (!train.BookSeatLocation?.trim()) {
        delete train.BookSeatLocation;
      }
      next.Train = train;
    }

    return next;
  });

  const result: TrainOrderBookDto = {
    ...base,
    Passengers: passengers,
  };

  if (!result.Linkmans?.length) {
    delete result.Linkmans;
  }

  if (!result.IsOfficialBooked) {
    delete result.AccountNumber;
  }

  if (result.IsExchange && result.ExchangeTicketId) {
    result.ExchangeTicketId = String(result.ExchangeTicketId);
  }

  return result;
}

/** Prefix BookSeatLocation with passenger index per legacy fillBookPassengers. */
export function formatBookSeatLocation(location: string | undefined): string | undefined {
  if (!location?.trim()) return undefined;
  const trimmed = location.trim();
  if (/^[12][A-Z]$/i.test(trimmed)) return trimmed.toUpperCase();
  return `1${trimmed}`;
}

export function isBerthSeatType(seatType: number | undefined): boolean {
  if (seatType == null) return false;
  const berthTypes: TrainSeatType[] = [
    4, 5, 6, 7, 8, 9, 14, 15, 17, 18, 19, 20, 21,
  ] as TrainSeatType[];
  return berthTypes.includes(seatType as TrainSeatType);
}
