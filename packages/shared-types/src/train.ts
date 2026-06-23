/** Train station from TmcApiHomeUrl-Resource-TrainStation. */
export interface TrainStation {
  Id: string;
  Code: string;
  Name: string;
  Nickname?: string;
  Pinyin?: string;
  Initial?: string;
  IsHot?: boolean;
}

export interface TrainSearchParams {
  Date: string;
  FromStation: string;
  ToStation: string;
  FromName?: string;
  ToName?: string;
}

export interface TrainBedInfo {
  BedTypeName?: string;
  Price?: number;
}

export interface TrainSeat {
  SeatTypeName?: string;
  Price?: number;
  /** Original ticket price before discount; used for discount badge when lower than Price. */
  TicketPrice?: number;
  Count?: number;
  /** Sleeper berth prices (legacy BedInfos). */
  BedInfos?: TrainBedInfo[];
}

export interface TrainItem {
  Id: string;
  TrainCode: string;
  StartTime: string;
  ArrivalTime: string;
  FromStation: string;
  ToStation: string;
  Duration?: string;
  Seats?: TrainSeat[];
  LowestPrice?: number;
  /** Client-side: cheapest train in current list. */
  isLowestPrice?: boolean;
  StartTimeStamp?: number;
  ArrivalTimeStamp?: number;
  /** Legacy API TravelTime in minutes; preferred for duration sort. */
  TravelTime?: number;
  DurationMinutes?: number;
  /** Days after departure when train arrives; 0 = same day. */
  ArriveDays?: number;
}

/**
 * Parse a train duration string into total minutes.
 *
 * Supported formats (from legacy TMC API `Duration` / `TravelTimeName`):
 *   "11时20分", "6小时10分", "4小时28分", "4h28m", "04:28", "268", "268分", "45分".
 */
export function parseTrainDurationMinutes(duration?: string): number {
  if (!duration?.trim()) return 0;
  const d = duration.trim();

  // "04:28" (HH:MM clock format from API)
  const clockMatch = d.match(/^(\d{1,2}):(\d{2})$/);
  if (clockMatch) {
    return Number(clockMatch[1]) * 60 + Number(clockMatch[2]);
  }

  // "268" (pure numeric minutes string)
  if (/^\d+$/.test(d)) {
    return Number(d);
  }

  const normalized = d.replace(/h/gi, "小时").replace(/m/gi, "分");
  const hourMatch = normalized.match(/(\d+)\s*(?:小时|时)/);
  const minuteMatch = normalized.match(/(\d+)\s*分/);
  const hours = hourMatch ? Number(hourMatch[1]) : 0;
  const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;
  return hours * 60 + minutes;
}

export function parseTravelTimeMinutes(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  }
  return undefined;
}

export interface TrainSearchResponse {
  Trains: TrainItem[];
}

export type TrainTypeFilter = "all" | "highSpeed" | "regular";

export type TrainSortTab = "none" | "filter" | "duration" | "time" | "price";

/** Duration toolbar: off (default list), short (asc), long (desc). */
export type TrainDurationSortMode = "off" | "short" | "long";

/** Price toolbar: off (default list), low (asc), high (desc). */
export type TrainPriceSortMode = "off" | "low" | "high";

export type TrainSortKind = "duration" | "time" | "price";

export interface TrainFilterOption {
  id: string;
  label: string;
  isChecked: boolean;
}

/** Client-side list filter (no extra API). */
export interface TrainFilterCondition {
  seatTypes: TrainFilterOption[];
  onlyHasTickets: boolean;
  /** Hour range [lower, upper) for departure; null = any */
  departureTimeSpan: { lower: number; upper: number } | null;
  /** Hour range [lower, upper) for arrival; null = any */
  arrivalTimeSpan: { lower: number; upper: number } | null;
}

/** Response from TmcApiHomeUrl-Resource-TrainStation (same shape as airport resource). */
export interface TrainStationResourceResponse {
  Trafficlines?: TrainStation[];
  TrafficLines?: TrainStation[];
}
