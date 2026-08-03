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
  showCancel?: boolean;
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
  /** True when this ticket was superseded by a change/exchange (legacy original ticket chain). */
  IsOriginal?: boolean;
  Actions?: TrainTicketActionFlags;
}

export interface TrainCancelParams {
  channel?: "tmc" | "tourist";
  OrderId: string;
  TicketId?: string;
  Channel?: string;
}

export interface TrainAbolishTicketParams {
  channel?: "tmc" | "tourist";
  OrderId: string;
  TicketId: string;
  Tag: "train";
  Channel?: string;
}

export interface TrainIssueParams {
  channel?: "tmc" | "tourist";
  OrderId: string;
}

export interface TrainRefundParams {
  channel?: "tmc" | "tourist";
  OrderId: string;
  TicketId: string;
  Channel: string;
}

export interface TrainExchangeInfoParams {
  channel?: "tmc" | "tourist";
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
  /** Original ticket price deducted from exchange total (legacy OrderTrainTicket.TicketPrice). */
  OriginalTicketPrice?: number;
  /** Original order pay type — hidden in exchange UI, sent on submit. */
  TravelPayType?: number;
  InsuranceAmount?: number;
  /** Original ticket passenger mobile for exchange contact fallback. */
  PassengerMobile?: string;
}

export interface TrainPassengerInfoParams {
  channel?: "tmc" | "tourist";
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
  ArrivalTime?: string;
}

/** Minimal book snapshot from Home-GetTrainPassenger for exchange flows. */
export interface TrainPassengerBookSnapshot {
  clientId: string;
  passenger: import("./passenger.js").StaffPassenger;
  credential: import("./passenger.js").PassengerCredential;
  isNotWhitelist?: boolean;
}
