import type { HotelOrderBillLine, HotelOrderHistory, HotelOrderTraveler } from "./hotel.js";

export interface FlightOrderTrip {
  FromCityName?: string;
  ToCityName?: string;
  FromAirportName?: string;
  ToAirportName?: string;
  FromTerminal?: string;
  ToTerminal?: string;
  TakeoffTime?: string;
  ArrivalTime?: string;
  FlightNumber?: string;
  CodeShareNumber?: string;
  PlaneType?: string;
  PlaneTypeDescribe?: string;
  CabinType?: string;
  FlyTime?: string;
  IsStop?: boolean;
  StopCities?: string;
  Airline?: string;
  AirlineName?: string;
  AirlineSrc?: string;
  CodeShareAirlineName?: string;
}

export interface FlightOrderTicket {
  Id: string;
  Key: string;
  Status?: string;
  StatusName?: string;
  FullTicketNo?: string;
  Explain?: string;
  IsOriginal?: boolean;
  Trips: FlightOrderTrip[];
  Traveler?: HotelOrderTraveler;
  PassengerTypeName?: string;
}

export interface FlightCancelParams {
  OrderId: string;
  TicketId: string;
  Channel: string;
  Tag?: "flight";
}

export interface FlightAbolishTicketParams {
  OrderId: string;
  TicketId: string;
  Tag: "flight";
}

export interface OrderContact {
  Name?: string;
  Mobile?: string;
  Email?: string;
}

export interface FlightOrderDetailFields {
  Tickets?: FlightOrderTicket[];
  BillItems?: HotelOrderBillLine[];
  Histories?: HotelOrderHistory[];
  PayHoldMinutes?: number;
  /** Numeric legacy `OrderTravelPayType` from VariablesObj. */
  TravelPayTypeCode?: number;
  /** Book contact from `OrderLinkmans` / order contact fields. */
  Contact?: OrderContact;
}
