import type { FlightFare } from "./flight.js";

/** Per-passenger cabin policy from `Home-Policy` (Legacy `flightPolicy`). */
export interface FlightBookPolicy {
  Rules?: string[];
  Descriptions?: string[];
  color?: string;
  IsAllowBook?: boolean | number | string;
  Cabin?: FlightFare;
  OrderTravelPays?: string;
  Id?: string;
  FlightNo?: string;
}

export interface FlightPolicyPassengerResult {
  PassengerKey?: string;
  FlightPolicies?: FlightBookPolicy[];
}

export interface FlightPolicyParams {
  /** JSON string of flight search/detail result — Legacy `Flights`. */
  Flights: string;
  /** Comma-separated account ids. */
  Passengers: string;
  FlightDetail?: string | null;
  TravelFromId?: string;
}
