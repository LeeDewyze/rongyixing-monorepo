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
}

export interface TrainSearchResponse {
  Trains: TrainItem[];
}

/** Response from TmcApiHomeUrl-Resource-TrainStation (same shape as airport resource). */
export interface TrainStationResourceResponse {
  Trafficlines?: TrainStation[];
  TrafficLines?: TrainStation[];
}
