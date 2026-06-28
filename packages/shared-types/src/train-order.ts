import type { HotelOrderTraveler } from "./hotel.js";

export interface TrainOrderTrip {
  TrainCode?: string;
  FromStationName?: string;
  ToStationName?: string;
  StartTime?: string;
  ArrivalTime?: string;
  RunTime?: string | number;
  CoachNo?: string;
  SeatNo?: string;
  SeatName?: string;
  SeatTypeName?: string;
  Price?: number;
  Explain?: string;
}

export interface TrainTicketActionFlags {
  showRefund?: boolean;
  showExchange?: boolean;
}

export interface TrainOrderTicket {
  Id: string;
  Key: string;
  Status?: string;
  StatusName?: string;
  /** User-facing ticket status from legacy App (preferred over StatusName). */
  AppStatusName?: string;
  FullTicketNo?: string;
  Explain?: string;
  /** Legacy ticket-level seat class name (e.g. 二等座). */
  SeatTypeName?: string;
  /** Legacy assigned coach/seat text (e.g. 06车01A号). */
  Detail?: string;
  /** Legacy numeric seat type enum. */
  SeatType?: number;
  Trips: TrainOrderTrip[];
  Traveler?: HotelOrderTraveler;
  PassengerTypeName?: string;
  Actions?: TrainTicketActionFlags;
}

export interface TrainCancelParams {
  OrderId: string;
  TicketId?: string;
  Channel?: string;
}

export interface TrainIssueParams {
  OrderId: string;
}

export interface TrainRefundParams {
  OrderId: string;
  TicketId: string;
  Channel: string;
}

export interface TrainExchangeInfoParams {
  TicketId: string;
}

/** Normalized exchange search context from Home-GetExchangeInfo. */
export interface TrainExchangeInfo {
  TicketId?: string;
  OrderId?: string;
  Date?: string;
  FromStation?: string;
  ToStation?: string;
  FromStationName?: string;
  ToStationName?: string;
}

export interface TrainPassengerInfoParams {
  TicketId: string;
}

/** Passenger snapshot from Home-GetTrainPassenger (refund confirmation). */
export interface TrainPassengerInfo {
  Name?: string;
  Mobile?: string;
  CredentialsTypeName?: string;
  HideCredentialsNumber?: string;
  TrainCode?: string;
  FromStationName?: string;
  ToStationName?: string;
  StartTime?: string;
}
