import type {
  TrainInitBookParams,
  TrainInitBookResponse,
  TrainBookParams,
  TrainBookResponse,
  TrainExchangeInfo,
  TrainExchangeInfoParams,
  TrainItem,
  TrainPassengerInfo,
  TrainPassengerInfoParams,
  TrainPolicyParams,
  TrainPolicyPassengerResult,
  TrainPolicyResponse,
  TrainScheduleParams,
  TrainScheduleResponse,
  TrainScheduleStop,
  TrainSearchParams,
  TrainSearchResponse,
  TrainSeat,
  TrainStation,
  TrainStationResourceResponse,
} from "@ryx/shared-types";
import {
  TrainSeatType,
  parseTrainDurationMinutes,
  parseTravelTimeMinutes,
} from "@ryx/shared-types";

import { TRAIN_FLOW_METHODS } from "../methods/train-flow.js";
import type { ProxyClient } from "../proxy/proxy-client.js";
import { prepareTrainBookSubmitDto, stripTrainInitBookDto } from "./train-book-adapter.js";
import { TOURIST_TRAIN_BOOK_METHODS, TOURIST_TRAIN_FLOW_METHODS } from "../methods/train-flow.js";

export interface TrainApi {
  getStations(): Promise<TrainStation[]>;
  searchTrains(params: TrainSearchParams): Promise<TrainSearchResponse>;
  getPolicy(params: TrainPolicyParams): Promise<TrainPolicyResponse>;
  getExchangeInfo(params: TrainExchangeInfoParams): Promise<TrainExchangeInfo>;
  getTrainPassenger(params: TrainPassengerInfoParams): Promise<TrainPassengerInfo>;
  getSchedule(params: TrainScheduleParams): Promise<TrainScheduleResponse>;
  initializeBook(params: TrainInitBookParams): Promise<TrainInitBookResponse>;
  submitBook(params: TrainBookParams): Promise<TrainBookResponse>;
  submitExchangeBook(params: TrainBookParams): Promise<TrainBookResponse>;
}

export { buildTrainPolicyTrainsPayload } from "./train-book-adapter.js";

type LegacyRecord = Record<string, unknown>;

function isTouristChannel(params?: { channel?: string }): boolean {
  return params?.channel === "tourist";
}

function stripChannel<T extends { channel?: string }>(params: T): Omit<T, "channel"> {
  const { channel: _channel, ...rest } = params;
  return rest;
}

const SEAT_TYPE_NAME_MAP: Record<string, TrainSeatType> = {
  无座: TrainSeatType.NoSeat,
  硬座: TrainSeatType.HardSeat,
  软座: TrainSeatType.SoftSeat,
  硬卧上: TrainSeatType.HardBerthUp,
  硬卧中: TrainSeatType.HardBerth,
  硬卧下: TrainSeatType.HardBerthDown,
  硬卧: TrainSeatType.HardBerth,
  软卧上: TrainSeatType.SoftBerthUp,
  软卧下: TrainSeatType.SoftBerth,
  软卧: TrainSeatType.SoftBerth,
  高级软卧: TrainSeatType.HighGradeSoftBerth,
  二等座: TrainSeatType.SecondClassSeat,
  一等座: TrainSeatType.FirstClassSeat,
  特等座: TrainSeatType.SpecialSeat,
  商务座: TrainSeatType.BusinessSeat,
  动卧上: TrainSeatType.BusinessBerthUp,
  动卧下: TrainSeatType.BusinessBerthDown,
  动卧: TrainSeatType.BusinessBerthDown,
  一等卧: TrainSeatType.FirstClassBerth,
  一等卧下: TrainSeatType.FirstClassBerthDown,
  二等卧: TrainSeatType.SecondClassBerth,
  二等卧中: TrainSeatType.SecondClassBerthMiddle,
  二等卧下: TrainSeatType.SecondClassBerthDown,
};

export function inferSeatTypeFromName(seatTypeName: string | undefined): number | undefined {
  if (!seatTypeName?.trim()) return undefined;
  const direct = SEAT_TYPE_NAME_MAP[seatTypeName.trim()];
  if (direct != null) return direct;
  const stripped = seatTypeName.replace(/[上中下]$/, "").trim();
  return SEAT_TYPE_NAME_MAP[stripped];
}

function normalizeTrainStations(
  res: TrainStation[] | TrainStationResourceResponse | null | undefined,
): TrainStation[] {
  if (Array.isArray(res)) return res;
  return res?.Trafficlines ?? res?.TrafficLines ?? [];
}

function parseSeatPrice(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function normalizeTrainDuration(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  return value.replace(/h/g, "小时").replace(/m/g, "分");
}

function normalizeBedInfos(value: unknown): TrainSeat["BedInfos"] {
  if (!Array.isArray(value)) return undefined;

  const beds = value
    .map((item) => {
      const bed = item as LegacyRecord;
      const bedTypeName = typeof bed.BedTypeName === "string" ? bed.BedTypeName : undefined;
      const price =
        parseSeatPrice(bed.BedTicketPrice) ??
        parseSeatPrice(bed.SalesPrice) ??
        parseSeatPrice(bed.Price);
      if (!bedTypeName && price === undefined) return null;
      return { BedTypeName: bedTypeName, Price: price };
    })
    .filter((bed): bed is NonNullable<typeof bed> => bed !== null);

  return beds.length ? beds : undefined;
}

function parseSeatType(value: unknown, seatTypeName: string | undefined): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return inferSeatTypeFromName(seatTypeName);
}

function normalizeTrainSeat(seat: LegacyRecord): TrainSeat {
  const price = parseSeatPrice(seat.SalesPrice) ?? parseSeatPrice(seat.Price);
  const ticketPrice = parseSeatPrice(seat.TicketPrice);
  const count = typeof seat.Count === "number" ? seat.Count : undefined;
  const seatTypeName = typeof seat.SeatTypeName === "string" ? seat.SeatTypeName : undefined;
  const bedInfos = normalizeBedInfos(seat.BedInfos);
  const seatType = parseSeatType(seat.SeatType, seatTypeName);

  return {
    SeatType: seatType,
    SeatTypeName: seatTypeName,
    Price: price,
    TicketPrice: ticketPrice,
    Count: count,
    BedInfos: bedInfos,
  };
}

function lowestSeatSalesPrice(seats: TrainSeat[]): number | undefined {
  if (!seats.length) return undefined;
  const prices = seats
    .map((seat) => seat.Price)
    .filter((price): price is number => price !== undefined);
  return prices.length ? Math.min(...prices) : undefined;
}

function parseDurationMinutesValue(train: LegacyRecord): number | undefined {
  const travelTime = parseTravelTimeMinutes(train.TravelTime);
  if (travelTime !== undefined) return travelTime;
  if (typeof train.DurationMinutes === "number" && Number.isFinite(train.DurationMinutes)) {
    return train.DurationMinutes;
  }
  const duration =
    normalizeTrainDuration(train.TravelTimeName) ??
    (typeof train.Duration === "string" ? train.Duration : undefined);
  const parsed = parseTrainDurationMinutes(duration);
  return parsed > 0 ? parsed : undefined;
}

function buildTrainItemId(train: LegacyRecord): string {
  const trainCode = typeof train.TrainCode === "string" ? train.TrainCode : "";
  const trainNo = typeof train.TrainNo === "string" ? train.TrainNo : "";
  const fromStationCode = typeof train.FromStationCode === "string" ? train.FromStationCode : "";
  const toStationCode = typeof train.ToStationCode === "string" ? train.ToStationCode : "";
  const startTime = typeof train.StartTime === "string" ? train.StartTime : "";
  const arrivalTime = typeof train.ArrivalTime === "string" ? train.ArrivalTime : "";
  const code = trainCode || trainNo;

  const routeKey = [code, fromStationCode, toStationCode, startTime, arrivalTime]
    .filter((part) => part.length > 0)
    .join("|");
  if (routeKey) return routeKey;

  const explicitId = typeof train.Id === "string" ? train.Id.trim() : "";
  if (explicitId && startTime) return `${explicitId}|${startTime}`;
  return explicitId || `train-${startTime || "unknown"}`;
}

function normalizeTrainItem(train: LegacyRecord): TrainItem {
  const seats = Array.isArray(train.Seats)
    ? train.Seats.map((seat) => normalizeTrainSeat(seat as LegacyRecord))
    : [];
  const trainCode = typeof train.TrainCode === "string" ? train.TrainCode : "";
  const trainNo = typeof train.TrainNo === "string" ? train.TrainNo : "";
  const fromStationCode = typeof train.FromStationCode === "string" ? train.FromStationCode : "";
  const toStationCode = typeof train.ToStationCode === "string" ? train.ToStationCode : "";
  const startTime = typeof train.StartTime === "string" ? train.StartTime : "";
  const id = buildTrainItemId(train);

  return {
    Id: id,
    searchSnapshot: { ...train },
    TrainNo: trainNo || trainCode,
    TrainCode: trainCode || trainNo,
    StartTime: startTime,
    ArrivalTime: typeof train.ArrivalTime === "string" ? train.ArrivalTime : "",
    FromStation:
      (typeof train.FromStationName === "string" && train.FromStationName) ||
      (typeof train.FromStation === "string" && train.FromStation) ||
      fromStationCode,
    ToStation:
      (typeof train.ToStationName === "string" && train.ToStationName) ||
      (typeof train.ToStation === "string" && train.ToStation) ||
      toStationCode,
    FromStationCode: fromStationCode || undefined,
    ToStationCode: toStationCode || undefined,
    Duration:
      normalizeTrainDuration(train.TravelTimeName) ??
      (typeof train.Duration === "string" ? train.Duration : undefined),
    Seats: seats,
    LowestPrice: lowestSeatSalesPrice(seats),
    StartTimeStamp: typeof train.StartTimeStamp === "number" ? train.StartTimeStamp : undefined,
    ArrivalTimeStamp:
      typeof train.ArrivalTimeStamp === "number" ? train.ArrivalTimeStamp : undefined,
    TravelTime: parseTravelTimeMinutes(train.TravelTime),
    DurationMinutes: parseDurationMinutesValue(train),
    ArriveDays: parseArriveDays(train.ArriveDays),
  };
}

function parseArriveDays(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function normalizeTrainPolicyItem(item: LegacyRecord) {
  const seatType =
    typeof item.SeatType === "number"
      ? item.SeatType
      : typeof item.SeatType === "string"
        ? Number(item.SeatType)
        : undefined;

  return {
    TrainNo: typeof item.TrainNo === "string" ? item.TrainNo : undefined,
    SeatType: Number.isFinite(seatType) ? seatType : undefined,
    IsAllowBook: typeof item.IsAllowBook === "boolean" ? item.IsAllowBook : undefined,
    IsForceBook: typeof item.IsForceBook === "boolean" ? item.IsForceBook : undefined,
    Rules: Array.isArray(item.Rules)
      ? item.Rules.filter((rule): rule is string => typeof rule === "string")
      : undefined,
    Descriptions: Array.isArray(item.Descriptions)
      ? item.Descriptions.filter((desc): desc is string => typeof desc === "string")
      : undefined,
  };
}

export function normalizeTrainPolicyResponse(res: unknown): TrainPolicyResponse {
  if (!Array.isArray(res)) return [];
  return res.map((entry) => {
    const row = entry as LegacyRecord;
    const policies = Array.isArray(row.TrainPolicies)
      ? row.TrainPolicies.map((policy) => normalizeTrainPolicyItem(policy as LegacyRecord))
      : undefined;
    return {
      PassengerKey: typeof row.PassengerKey === "string" ? row.PassengerKey : undefined,
      TrainPolicies: policies,
    } satisfies TrainPolicyPassengerResult;
  });
}

export function normalizeTrainInitBookResponse(res: unknown): TrainInitBookResponse {
  if (!res || typeof res !== "object") return {};
  const payload = res as LegacyRecord;
  const linkman =
    payload.Linkman && typeof payload.Linkman === "object"
      ? (payload.Linkman as LegacyRecord)
      : undefined;
  return {
    ...(payload as TrainInitBookResponse),
    OrderAmount: typeof payload.OrderAmount === "number" ? payload.OrderAmount : undefined,
    ServiceFees:
      payload.ServiceFees && typeof payload.ServiceFees === "object"
        ? (payload.ServiceFees as Record<string, number | string>)
        : undefined,
    PayTypes:
      payload.PayTypes && typeof payload.PayTypes === "object"
        ? (payload.PayTypes as Record<string, string>)
        : undefined,
    IllegalReasons: Array.isArray(payload.IllegalReasons)
      ? payload.IllegalReasons.filter((item): item is string => typeof item === "string")
      : undefined,
    ExpenseTypes: Array.isArray(payload.ExpenseTypes)
      ? payload.ExpenseTypes.map((item) => {
          const row = item as LegacyRecord;
          return {
            Id: String(row.Id ?? ""),
            Name: String(row.Name ?? ""),
            Tag: typeof row.Tag === "string" ? row.Tag : undefined,
          };
        })
      : undefined,
    Staffs: Array.isArray(payload.Staffs)
      ? (payload.Staffs as TrainInitBookResponse["Staffs"])
      : undefined,
    OutNumbers:
      payload.OutNumbers && typeof payload.OutNumbers === "object"
        ? (payload.OutNumbers as Record<string, string[]>)
        : undefined,
    Tmc:
      payload.Tmc && typeof payload.Tmc === "object"
        ? (payload.Tmc as Record<string, unknown>)
        : undefined,
    TmcServices: Array.isArray(payload.TmcServices)
      ? payload.TmcServices.map(
          (item) =>
            item as TrainInitBookResponse["TmcServices"] extends (infer U)[] | undefined
              ? U
              : never,
        )
      : undefined,
    isSkipApprove: typeof payload.isSkipApprove === "boolean" ? payload.isSkipApprove : undefined,
    IsShowOfficalBooked:
      typeof payload.IsShowOfficalBooked === "boolean" ? payload.IsShowOfficalBooked : undefined,
    IsShowDirectBooked:
      typeof payload.IsShowDirectBooked === "boolean" ? payload.IsShowDirectBooked : undefined,
    Linkman: linkman
      ? {
          Id: linkman.Id == null ? undefined : String(linkman.Id),
          Name: typeof linkman.Name === "string" ? linkman.Name : undefined,
          Mobile: typeof linkman.Mobile === "string" ? linkman.Mobile : undefined,
          Email: typeof linkman.Email === "string" ? linkman.Email : undefined,
        }
      : undefined,
    AccountNumber12306:
      payload.AccountNumber12306 && typeof payload.AccountNumber12306 === "object"
        ? {
            Name:
              typeof (payload.AccountNumber12306 as LegacyRecord).Name === "string"
                ? ((payload.AccountNumber12306 as LegacyRecord).Name as string)
                : undefined,
            IsIdentity:
              typeof (payload.AccountNumber12306 as LegacyRecord).IsIdentity === "boolean"
                ? ((payload.AccountNumber12306 as LegacyRecord).IsIdentity as boolean)
                : undefined,
          }
        : undefined,
  };
}

function readResponseId(value: unknown): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed && trimmed !== "0" ? trimmed : "";
  }
  if (typeof value === "number" && Number.isFinite(value) && value !== 0) {
    return String(Math.trunc(value));
  }
  return "";
}

export function normalizeTrainBookResponse(res: unknown): TrainBookResponse {
  if (!res || typeof res !== "object") {
    return { OrderId: "" };
  }
  const payload = res as LegacyRecord;
  const tradeNo = readResponseId(payload.TradeNo);
  const orderId = readResponseId(payload.OrderId) || readResponseId(payload.Id) || tradeNo;
  return {
    OrderId: orderId,
    OrderNumber: typeof payload.OrderNumber === "string" ? payload.OrderNumber : undefined,
    TradeNo: tradeNo || undefined,
    HasTasks: typeof payload.HasTasks === "boolean" ? payload.HasTasks : undefined,
    IsCheckPay: typeof payload.IsCheckPay === "boolean" ? payload.IsCheckPay : undefined,
  };
}

function readExchangeString(payload: LegacyRecord, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

export function normalizeTrainExchangeInfo(res: unknown): TrainExchangeInfo {
  if (!res || typeof res !== "object") {
    return {};
  }
  const payload = res as LegacyRecord;
  return {
    TicketId: readExchangeString(payload, "TicketId", "Id"),
    OrderId: readExchangeString(payload, "OrderId"),
    Date: readExchangeString(payload, "Date", "GoDate", "DepartDate"),
    FromStation: readExchangeString(payload, "FromStation", "FromStationCode"),
    ToStation: readExchangeString(payload, "ToStation", "ToStationCode"),
    FromStationName: readExchangeString(payload, "FromStationName", "FromStation"),
    ToStationName: readExchangeString(payload, "ToStationName", "ToStation"),
  };
}

export function normalizeTrainPassengerInfo(res: unknown): TrainPassengerInfo {
  if (!res || typeof res !== "object") {
    return {};
  }
  const payload = res as LegacyRecord;
  const passenger = (payload.Passenger as LegacyRecord | undefined) ?? payload;
  const trip =
    (payload.Trip as LegacyRecord | undefined) ?? (payload.Train as LegacyRecord | undefined);
  return {
    Name: readExchangeString(passenger, "Name"),
    Mobile: readExchangeString(passenger, "Mobile"),
    CredentialsTypeName: readExchangeString(passenger, "CredentialsTypeName", "CredentialTypeName"),
    HideCredentialsNumber: readExchangeString(
      passenger,
      "HideCredentialsNumber",
      "CredentialsNumber",
    ),
    TrainCode: readExchangeString(trip ?? payload, "TrainCode", "TrainNo", "Number"),
    FromStationName: readExchangeString(trip ?? payload, "FromStationName", "FromStation"),
    ToStationName: readExchangeString(trip ?? payload, "ToStationName", "ToStation"),
    StartTime: readExchangeString(trip ?? payload, "StartTime", "DepartureTime", "GoDate"),
  };
}

function isScheduleStopRecord(record: LegacyRecord): boolean {
  return (
    typeof record.StationName === "string" ||
    typeof record.Name === "string" ||
    typeof record.Station === "string"
  );
}

function extractScheduleStops(value: unknown): LegacyRecord[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value as LegacyRecord[];
}

function normalizeTrainScheduleStop(stop: LegacyRecord): TrainScheduleStop {
  return {
    StationName: readExchangeString(stop, "StationName", "Name", "Station"),
    ArriveTime: readExchangeString(stop, "ArriveTime", "ArrivalTime"),
    DepartTime: readExchangeString(stop, "DepartTime", "StartTime", "DepartureTime"),
    StopoverTime: readExchangeString(stop, "StopoverTime", "StayTime", "RunTime"),
    Sequence:
      typeof stop.Sequence === "number"
        ? stop.Sequence
        : typeof stop.Sequence === "string"
          ? Number(stop.Sequence)
          : typeof stop.StationNo === "string"
            ? Number(stop.StationNo)
            : undefined,
  };
}

export function normalizeTrainScheduleResponse(res: unknown): TrainScheduleResponse {
  if (Array.isArray(res)) {
    if (res.length === 0) return { Stops: [] };

    const first = res[0] as LegacyRecord;
    const nestedStops = extractScheduleStops(first.Schedules ?? first.TrainSchedules);
    if (nestedStops?.length) {
      return { Stops: nestedStops.map((item) => normalizeTrainScheduleStop(item)) };
    }

    if (isScheduleStopRecord(first)) {
      return { Stops: res.map((item) => normalizeTrainScheduleStop(item as LegacyRecord)) };
    }

    return { Stops: [] };
  }

  if (res && typeof res === "object") {
    const payload = res as LegacyRecord;
    const nestedStops = extractScheduleStops(
      payload.Schedules ??
        payload.TrainSchedules ??
        payload.Stops ??
        payload.TrainStops ??
        payload.Schedule,
    );
    if (nestedStops?.length) {
      return { Stops: nestedStops.map((item) => normalizeTrainScheduleStop(item)) };
    }
  }

  return { Stops: [] };
}

/** Legacy Home-Search returns TrainEntity[] in Data; mock uses { Trains }. */
export function normalizeTrainSearchResponse(res: unknown): TrainSearchResponse {
  if (Array.isArray(res)) {
    return { Trains: res.map((train) => normalizeTrainItem(train as LegacyRecord)) };
  }

  if (res && typeof res === "object") {
    const payload = res as LegacyRecord;
    const trains = payload.Trains;
    if (Array.isArray(trains)) {
      return { Trains: trains.map((train) => normalizeTrainItem(train as LegacyRecord)) };
    }
  }

  return { Trains: [] };
}

export function createTrainApi(proxy: ProxyClient): TrainApi {
  return {
    async getStations() {
      const res = await proxy.send<TrainStation[] | TrainStationResourceResponse>({
        method: TRAIN_FLOW_METHODS.RESOURCE_STATION,
        data: {},
      });
      return normalizeTrainStations(res);
    },
    async searchTrains(params) {
      const res = await proxy.send<unknown>({
        method: isTouristChannel(params)
          ? TOURIST_TRAIN_FLOW_METHODS.HOME_SEARCH
          : TRAIN_FLOW_METHODS.HOME_SEARCH,
        data: stripChannel({
          Date: params.Date,
          FromStation: params.FromStation,
          ToStation: params.ToStation,
          TrainCode: "",
          channel: params.channel,
        }),
        version: "1.0",
        requestTimeout: 60,
        timeoutMs: 60_000,
      });
      return normalizeTrainSearchResponse(res);
    },
    async getPolicy(params) {
      const res = await proxy.send<unknown>({
        method: TRAIN_FLOW_METHODS.POLICY,
        data: params,
        version: "2.0",
        requestTimeout: 60,
        timeoutMs: 60_000,
      });
      return normalizeTrainPolicyResponse(res);
    },
    async getExchangeInfo(params) {
      const res = await proxy.send<unknown>({
        method: TRAIN_FLOW_METHODS.GET_EXCHANGE_INFO,
        data: params,
      });
      return normalizeTrainExchangeInfo(res);
    },
    async getTrainPassenger(params) {
      const res = await proxy.send<unknown>({
        method: TRAIN_FLOW_METHODS.GET_TRAIN_PASSENGER,
        data: params,
      });
      return normalizeTrainPassengerInfo(res);
    },
    async getSchedule(params) {
      const res = await proxy.send<unknown>({
        method: isTouristChannel(params)
          ? TOURIST_TRAIN_FLOW_METHODS.SCHEDULE
          : TRAIN_FLOW_METHODS.SCHEDULE,
        data: stripChannel(params),
        version: "1.0",
      });
      return normalizeTrainScheduleResponse(res);
    },
    async initializeBook(params) {
      const res = await proxy.send<unknown>({
        method: isTouristChannel(params)
          ? TOURIST_TRAIN_BOOK_METHODS.INIT
          : TRAIN_FLOW_METHODS.INIT,
        data: stripChannel(stripTrainInitBookDto(params)),
        timeoutMs: 60_000,
      });
      return normalizeTrainInitBookResponse(res);
    },
    async submitBook(params) {
      const res = await proxy.send<unknown>({
        method: isTouristChannel(params)
          ? TOURIST_TRAIN_BOOK_METHODS.BOOK
          : TRAIN_FLOW_METHODS.BOOK,
        data: stripChannel(prepareTrainBookSubmitDto(params)),
        timeoutMs: 60_000,
      });
      return normalizeTrainBookResponse(res);
    },
    async submitExchangeBook(params) {
      const res = await proxy.send<unknown>({
        method: isTouristChannel(params)
          ? TOURIST_TRAIN_BOOK_METHODS.EXCHANGE_BOOK
          : TRAIN_FLOW_METHODS.EXCHANGE_BOOK,
        data: prepareTrainBookSubmitDto({
          ...params,
          IsExchange: true,
        }),
        timeoutMs: 60_000,
      });
      return normalizeTrainBookResponse(res);
    },
  };
}
