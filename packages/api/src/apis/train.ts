import type {
  TrainItem,
  TrainSearchParams,
  TrainSearchResponse,
  TrainSeat,
  TrainStation,
  TrainStationResourceResponse,
} from "@ryx/shared-types";
import { parseTrainDurationMinutes, parseTravelTimeMinutes } from "@ryx/shared-types";

import { TRAIN_FLOW_METHODS } from "../methods/train-flow.js";
import type { ProxyClient } from "../proxy/proxy-client.js";

export interface TrainApi {
  getStations(): Promise<TrainStation[]>;
  searchTrains(params: TrainSearchParams): Promise<TrainSearchResponse>;
}

type LegacyRecord = Record<string, unknown>;

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

function normalizeTrainSeat(seat: LegacyRecord): TrainSeat {
  // Legacy list UI uses seat.SalesPrice only (see train-list-item_ryx.base getLowestSeatPrice).
  const price = parseSeatPrice(seat.SalesPrice);
  const count = typeof seat.Count === "number" ? seat.Count : undefined;
  const seatTypeName = typeof seat.SeatTypeName === "string" ? seat.SeatTypeName : undefined;

  return {
    SeatTypeName: seatTypeName,
    Price: price,
    Count: count,
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
  const startTime = typeof train.StartTime === "string" ? train.StartTime : "";
  const id = buildTrainItemId(train);

  return {
    Id: id,
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
      (typeof train.ToStationCode === "string" ? train.ToStationCode : ""),
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
        method: TRAIN_FLOW_METHODS.HOME_SEARCH,
        data: {
          Date: params.Date,
          FromStation: params.FromStation,
          ToStation: params.ToStation,
          TrainCode: "",
        },
        version: "1.0",
        requestTimeout: 60,
        timeoutMs: 60_000,
      });
      return normalizeTrainSearchResponse(res);
    },
  };
}
