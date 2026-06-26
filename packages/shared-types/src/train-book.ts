import type { FlightInitStaff } from "./flight-book.js";
import type { TrainBookPolicy } from "./train-policy.js";

export interface TrainBookCredential {
  Id?: string;
  Name?: string;
  Mobile?: string;
  Number?: string;
  Type?: number | string;
  CredentialsType?: number | string;
  AccountId?: string;
  Account?: { Id?: string };
}

/** Legacy train entity wire shape for Initialize/Book. */
export interface TrainBookEntityDto {
  TrainNo?: string;
  TrainCode?: string;
  StartTime?: string;
  ArrivalTime?: string;
  FromStation?: string;
  ToStation?: string;
  FromStationName?: string;
  ToStationName?: string;
  FromStationCode?: string;
  ToStationCode?: string;
  TravelTimeName?: string;
  ArriveDays?: number | string;
  IsAccessByIdCard?: boolean;
  Seats?: TrainBookSeatDto[];
  OriginalSearchResultSeats?: TrainBookSeatDto[];
  BookSeatType?: number;
  BookSeatLocation?: string;
  InsuranceProducts?: unknown[];
}

export interface TrainBookSeatDto {
  SeatType?: number;
  SeatTypeName?: string;
  SalesPrice?: number;
  TicketPrice?: number;
  Price?: number;
  Count?: number;
  BedInfos?: { BedTypeName?: string; Price?: number; SalesPrice?: number }[];
}

export interface TrainBookPassengerDto {
  ClientId: string;
  Mobile?: string;
  Email?: string;
  MessageLang?: string;
  Credentials?: TrainBookCredential;
  Train?: TrainBookEntityDto;
  Policy?: Record<string, unknown>;
  IllegalPolicy?: string;
  IllegalReason?: string;
  ExpenseType?: string;
  ApprovalId?: string;
  IsSkipApprove?: boolean;
  TravelPayType?: number;
  TravelType?: number;
  travelFormId?: string;
  travelNumber?: string;
  CostCenterCode?: string;
  CostCenterName?: string;
  OrganizationName?: string;
  OrganizationCode?: string;
  OutNumbers?: Record<string, string> | null;
}

export interface TrainBookLinkmanDto {
  Id?: string;
  Name?: string;
  Mobile?: string;
  Email?: string;
  MessageLang?: string;
}

export interface TrainOrderBookDto {
  TravelFormId?: string;
  Passengers: TrainBookPassengerDto[];
  Linkmans?: TrainBookLinkmanDto[];
  AgentId?: string;
  Channel?: string;
  TravelPayType?: number;
  IsOfficialBooked?: boolean;
  AccountNumber?: string;
  IsFromOffline?: boolean;
  /** Train exchange book — legacy ExchangeBook payload. */
  IsExchange?: boolean;
  ExchangeTicketId?: string;
}

export type TrainInitBookParams = TrainOrderBookDto;

export interface TrainAccountNumber12306 {
  Name?: string;
  IsIdentity?: boolean;
}

export interface TrainInitBookResponse {
  OrderAmount?: number;
  ServiceFees?: Record<string, number | string>;
  PayTypes?: Record<string, string>;
  IllegalReasons?: string[];
  ExpenseTypes?: { Id: string; Name: string; Tag?: string }[];
  Staffs?: FlightInitStaff[];
  OutNumbers?: Record<string, string[]>;
  Tmc?: Record<string, unknown>;
  TmcServices?: { Id?: string | number; Name?: string; LogoFullFileName?: string }[];
  isSkipApprove?: boolean;
  IsShowOfficalBooked?: boolean;
  IsShowDirectBooked?: boolean;
  AccountNumber12306?: TrainAccountNumber12306;
}

export type TrainBookParams = TrainOrderBookDto;

export interface TrainBookResponse {
  OrderId: string;
  OrderNumber?: string;
  TradeNo?: string;
  HasTasks?: boolean;
  IsCheckPay?: boolean;
}

/** Session payload for list → book handoff. */
export interface TrainBookSelectionPolicy {
  policy?: TrainBookPolicy;
  passengerId: string;
}
