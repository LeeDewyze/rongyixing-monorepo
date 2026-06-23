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
  /** Home-Detail lookup key from list API (`Data` in Legacy). */
  DetailKey?: string;
  Data?: string;
  /** From `FlightViews[].BookType` — required for full Home-Detail fares. */
  BookType?: string | number;
  /** Low inventory hint — show「剩N张」when 1–5. */
  RemainSeats?: number;
}

export interface FlightListView {
  Price?: string;
  Data?: string;
  BookType?: string | number;
  /** Combined flight numbers for transfer itineraries, e.g. `SC7954SC7615`. */
  FlightNos?: string;
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

/** Home-Detail query (TmcApiFlightUrl-Home-Detail v2.0). */
export interface FlightDetailParams {
  Date: string;
  FromCode: string;
  ToCode: string;
  FlightNumber: string;
  FromAsAirport?: boolean;
  ToAsAirport?: boolean;
  ADTPtcs?: number;
  DetailKey?: string;
  BookType?: string;
  Lang?: string;
}

export interface FlightTax {
  Name?: string;
  Tag?: string;
  Tax?: number | string;
}

export interface FlightFareBasic {
  CabinCode?: string;
  CabinType?: number;
  CabinTypeName?: string;
  CabinTypeAttach?: string;
  Discount?: number | string;
  FareType?: number;
  Count?: string | number;
  FlightSegmentIds?: string[];
  FlightTaxs?: FlightTax[];
}

export interface FlightFareRule {
  Name?: string;
  Description?: string;
  Tag?: string;
  Variables?: string | FlightFareVariables;
  VariablesObj?: FlightFareVariables;
}

export interface FlightFareVariables {
  Baggage?: string;
  [key: string]: unknown;
}

/** Cabin fare row from Home-Detail `FlightFares`. */
export interface FlightFare {
  Id?: string;
  Code?: string;
  FlightNumber?: string;
  Type?: number;
  TypeName?: string;
  Name?: string;
  Explain?: string;
  SalesPrice?: string;
  TicketPrice?: string;
  Tax?: string;
  Discount?: string | number;
  Count?: string | number;
  IsAgreement?: boolean;
  IsAllowOrder?: boolean;
  FareType?: number;
  FareTypeName?: string;
  Variables?: string | FlightFareVariables;
  VariablesObj?: FlightFareVariables;
  FlightFareBasics?: FlightFareBasic[];
  FlightFareRules?: FlightFareRule[];
}

export interface FlightDetailResult {
  FlightSegments?: FlightSegment[];
  FlightFares?: FlightFare[];
}

export type FlightCabinTab = "economy" | "business";
