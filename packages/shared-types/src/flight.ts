/** Airport / city line from TmcApiHomeUrl-Resource-Airport. */
export interface Trafficline {
  Id: string;
  Tag: "Airport" | "AirportCity" | string;
  Code: string;
  Name: string;
  Nickname?: string;
  Pinyin?: string;
  Initial?: string;
  AirportCityCode?: string;
  CityCode?: string;
  CityName?: string;
  EnglishName?: string;
  CountryCode?: string;
  IsHot?: boolean;
  IsDeprecated?: boolean;
  Sequence?: number;
  FirstLetter?: string;
}

export interface AirportResourceParams {
  LastUpdateTime?: number;
}

export interface AirportResourceResponse {
  Trafficlines: Trafficline[];
  LastUpdateTime?: number;
}

/** Domestic flight list query (TmcApiFlightUrl-Home-Index). */
export interface FlightSearchParams {
  Date: string;
  FromCode: string;
  ToCode: string;
  FromAsAirport?: boolean;
  ToAsAirport?: boolean;
}

export interface FlightSegment {
  Id: string;
  Number: string;
  FlightNumber?: string;
  Airline?: string;
  AirlineName?: string;
  AirlineSrc?: string;
  FromAirport?: string;
  FromAirportName?: string;
  FromCityName?: string;
  FromTerminal?: string;
  ToAirport?: string;
  ToAirportName?: string;
  ToCityName?: string;
  ToTerminal?: string;
  TakeoffTime: string;
  ArrivalTime: string;
  TakeoffTimeStamp?: number;
  ArrivalTimeStamp?: number;
  FlyTime?: string;
  FlyTimeName?: string;
  LowestFare?: string;
  Tax?: string;
  IsStop?: boolean;
  IsTransfer?: boolean;
  IsAgreement?: boolean;
  isLowestPrice?: boolean;
  PlaneType?: string;
  PlaneTypeDescribe?: string;
  Meal?: string;
  CodeShareNumber?: string;
  CodeShareAirlineName?: string;
}

export interface FlightListView {
  Price?: string;
  Segment?: FlightSegment;
}

export interface FlightListResult {
  Result?: {
    FlightSegments?: FlightSegment[];
  };
  FlightViews?: FlightListView[];
}

/** Client-side list filter (no extra API). */
export interface FlightFilterOption {
  id: string;
  label: string;
  isChecked: boolean;
}

export interface FlightFilterCondition {
  onlyDirect: boolean;
  isAgreement: boolean;
  airCompanies: FlightFilterOption[];
  fromAirports: FlightFilterOption[];
  toAirports: FlightFilterOption[];
  airTypes: FlightFilterOption[];
  /** Hour range [lower, upper) for takeoff; null = any */
  takeOffTimeSpan: { lower: number; upper: number } | null;
}

export type FlightSortTab = "none" | "filter" | "time" | "price";
