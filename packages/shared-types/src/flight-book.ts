import type { FlightFare, FlightSegment } from "./flight.js";
import type { TravelUrlTravelType } from "./travel.js";

export interface FlightInsuranceProduct {
  Id?: string | number;
  Name?: string;
  Price?: string | number;
  Detail?: string;
  DetailUrl?: string;
}

export interface FlightInitStaffApprover {
  Name?: string;
  Type?: number;
  Tag?: string;
  AccountId?: string | number;
}

export interface FlightTmcAgent {
  Id?: string | number;
  Name?: string;
  LogoFullFileName?: string;
  FlightQueryType?: string | number;
}

export interface FlightOutNumberField {
  key: string;
  label: string;
  value: string;
  required: boolean;
  isTravelNumber?: boolean;
  canSelect?: boolean;
  labelDataList?: string[];
  staffNumber?: string;
  staffOutNumber?: string;
  travelType?: TravelUrlTravelType;
}

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
  CardName?: string;
  CardNumber?: string;
  TicketNum?: string;
  Mobile?: string;
  FlightSegments?: FlightSegment[];
  FlightSegment?: FlightSegment;
  FlightCabin?: FlightFare;
  Credentials?: FlightBookCredential;
  travelFormId?: string;
  travelNumber?: string;
  Policy?: Record<string, unknown>;
  TravelPayType?: number;
  MessageLang?: string;
  Email?: string;
  CostCenterCode?: string;
  CostCenterName?: string;
  OrganizationName?: string;
  OrganizationCode?: string;
  OutNumbers?: Record<string, string> | null;
  InsuranceProducts?: FlightInsuranceProduct[];
  IllegalReason?: string;
  IllegalPolicy?: string;
  ExpenseType?: string;
  ApprovalId?: string;
  IsSkipApprove?: boolean;
  TravelType?: number;
}

export interface FlightInitStaffAccount {
  Id?: string | number;
  Mobile?: string;
  Email?: string | null;
}

export interface FlightInitStaffOrg {
  Code?: string;
  Name?: string;
  Parent?: unknown;
  ParentId?: string;
  Id?: string;
}

export interface FlightInitStaff {
  Account?: FlightInitStaffAccount;
  CostCenter?: FlightInitStaffOrg;
  Organization?: FlightInitStaffOrg;
  Name?: string;
  Id?: string | number;
  Number?: string;
  OutNumber?: string;
  Approvers?: FlightInitStaffApprover[];
  DefaultApprover?: { AccountId?: string | number; Name?: string };
  Policy?: Record<string, unknown> | null;
}

export interface BookOrganizationOption {
  Id?: string;
  Code?: string;
  Name?: string;
  ParentId?: string;
  Parent?: { Id?: string };
}

export interface BookCostCenterOption {
  Text: string;
  Value: string;
}

export interface FlightPassengerContactOption {
  value: string;
  checked: boolean;
}

/** Per-passenger book form state (Legacy combindInfo credential detail). */
export interface FlightPassengerBookForm {
  passengerId: string;
  mobileOptions: FlightPassengerContactOption[];
  emailOptions: FlightPassengerContactOption[];
  otherMobile: string;
  otherEmail: string;
  organization: { code: string; name: string };
  otherOrganizationName: string;
  costCenter: { code: string; name: string };
  otherCostCenterName: string;
  otherCostCenterCode: string;
  expanded: boolean;
  /** 出差信息 */
  showTravelDetail: boolean;
  expenseType: string;
  illegalReason: string;
  otherIllegalReason: string;
  selectedInsuranceId: string;
  outNumbers: Record<string, string>;
  approvalId: string;
  selectedApproverName: string;
  isSkipApprove: boolean;
}

export interface FlightBookLinkmanDto {
  Id?: string;
  Name?: string;
  Mobile?: string;
  Email?: string;
  MessageLang?: string;
}

/** Authorized account that can view the order (Legacy `AddContact`). */
export interface FlightAuthorizedContact {
  accountId: string;
  name: string;
  mobile?: string;
  email?: string;
  notifyLanguage?: string;
}

export interface SearchLinkmanOption {
  Text: string;
  Value: string;
}

/** Legacy `OrderBookDto` — PascalCase matches backend. */
export interface FlightOrderBookDto {
  channel?: "tmc" | "tourist";
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
  Staffs?: FlightInitStaff[];
  Insurances?: Record<string, FlightInsuranceProduct[] | null>;
  Tmc?: Record<string, unknown>;
  OutNumbers?: Record<string, string[]>;
  TmcServices?: FlightTmcAgent[];
  isSkipApprove?: boolean;
  TravelFrom?: { TravelNumber?: string; Id?: string; Numbers?: string[] };
}

export interface SearchApprovalOption {
  Text: string;
  Value: string;
}

export type FlightBookParams = FlightOrderBookDto;

export interface FlightBookResponse {
  OrderId?: string;
  OrderNumber?: string;
  TradeNo?: string;
  HasTasks?: boolean;
  IsCheckPay?: boolean;
}
