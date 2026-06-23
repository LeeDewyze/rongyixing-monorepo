import type { FlightFare, FlightSegment } from "./flight.js";

export interface FlightBookCredential {
  Id?: string;
  Name?: string;
  Mobile?: string;
  Number?: string;
  Type?: number | string;
  CredentialsType?: number | string;
  Gender?: string;
  Surname?: string;
  Givenname?: string;
  Account?: { Id?: string };
}

export interface FlightBookPassengerDto {
  ClientId: string;
  Mobile?: string;
  FlightSegments?: FlightSegment[];
  FlightSegment?: FlightSegment;
  FlightCabin?: FlightFare;
  Credentials?: FlightBookCredential;
  travelFormId?: string;
  travelNumber?: string;
  Policy?: Record<string, unknown>;
  TravelPayType?: number;
  OutNumbers?: Record<string, string> | null;
}

export interface FlightBookLinkmanDto {
  Id?: string;
  Name?: string;
  Mobile?: string;
  Email?: string;
  MessageLang?: string;
}

/** Legacy `OrderBookDto` — PascalCase matches backend. */
export interface FlightOrderBookDto {
  TravelFormId?: string;
  Passengers: FlightBookPassengerDto[];
  Linkmans?: FlightBookLinkmanDto[];
  AgentId?: string;
  Channel?: string;
  TravelPayType?: number;
  IsFromOffline?: boolean;
  IsForbidAutoIssue?: boolean;
}

export type FlightInitBookParams = FlightOrderBookDto;

export interface FlightInitBookResponse {
  OrderAmount?: number;
  ServiceFees?: Record<string, number | string>;
  PayTypes?: Record<string, string>;
  IllegalReasons?: string[];
  ExpenseTypes?: { Id: string; Name: string; Tag?: string }[];
  Staffs?: unknown[];
  Insurances?: Record<string, unknown>;
  Tmc?: Record<string, unknown>;
}

export type FlightBookParams = FlightOrderBookDto;

export interface FlightBookResponse {
  OrderId?: string;
  OrderNumber?: string;
  TradeNo?: string;
  HasTasks?: boolean;
  IsCheckPay?: boolean;
}
