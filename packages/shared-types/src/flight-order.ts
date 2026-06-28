import type { HotelOrderBillLine, HotelOrderHistory, HotelOrderTraveler } from "./hotel.js";
import type { TrainOrderTicket } from "./train-order.js";

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
  IsTransfer?: boolean;
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
  AppStatusName?: string;
  FullTicketNo?: string;
  Explain?: string;
  IsOriginal?: boolean;
  Trips: FlightOrderTrip[];
  Traveler?: HotelOrderTraveler;
  PassengerTypeName?: string;
  Actions?: {
    showCancel?: boolean;
    showRefund?: boolean;
  };
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

export interface FlightTicketRefundInfoParams {
  orderFlightTicket: string;
}

export interface FlightTicketRefundInfo {
  CanAutoRefund?: boolean;
  IsOffline?: boolean;
  RefundFee?: string | number;
  Message?: string;
}

export interface FlightRefundParams {
  orderId: string;
  ticketId: string;
  IsVoluntary: boolean;
  FileName?: string;
  FileValue?: string;
}

export interface FlightNonVoluntaryRefundParams {
  OrderFlightTicketId: string;
  OrderId: string;
  IsVoluntary: false;
}

export interface OrderContact {
  Name?: string;
  Mobile?: string;
  Email?: string;
}

export type OrderDetailTicket = FlightOrderTicket | TrainOrderTicket;

export interface FlightOrderDetailFields {
  Tickets?: OrderDetailTicket[];
  BillItems?: HotelOrderBillLine[];
  Histories?: HotelOrderHistory[];
  PayHoldMinutes?: number;
  /** Numeric legacy `OrderTravelPayType` from VariablesObj. */
  TravelPayTypeCode?: number;
  /** Book contact from `OrderLinkmans` / order contact fields. */
  Contact?: OrderContact;
}
