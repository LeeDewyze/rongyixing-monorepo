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

export interface TrainSeat {
  SeatTypeName?: string;
  Price?: number;
  Count?: number;
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
  DurationMinutes?: number;
  /** Days after departure when train arrives; 0 = same day. */
  ArriveDays?: number;
}

export interface TrainSearchResponse {
  Trains: TrainItem[];
}

export type TrainTypeFilter = "all" | "highSpeed" | "regular";

export type TrainSortTab = "none" | "filter" | "duration" | "time" | "price";

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
}

/** Response from TmcApiHomeUrl-Resource-TrainStation (same shape as airport resource). */
export interface TrainStationResourceResponse {
  Trafficlines?: TrainStation[];
  TrafficLines?: TrainStation[];
}
