/** Generic API response wrapper for backend DTOs. */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export type { ApiConfigSetting, ApiMode, ApiResult, IResponse, ProxySendOptions } from "./proxy.js";

export type {
  ApprovalTask,
  ApprovalTaskListParams,
  OrderApprovalTaskParams,
  OrderApprovalTaskType,
  WaitingTaskCountResult,
  WorkflowNotify,
} from "./approval-task.js";

export type {
  WorkbenchGroup,
  WorkbenchItem,
  WorkbenchLink,
  WorkbenchLoadResponse,
} from "./workbench.js";
export { normalizeWorkbenchResponse } from "./workbench.js";

export type {
  DeviceLoginParams,
  IdentityDto,
  LoginResultDto,
  MobileLoginParams,
  PasswordLoginParams,
  WebSocketUrlDto,
} from "./auth-proxy.js";

export type {
  HotelBookCredentialsDto,
  HotelBookLinkmanDto,
  HotelBookParams,
  HotelBookPassenger,
  HotelBookPassengerDto,
  HotelBookResponse,
  HotelBookRoomPlanDto,
  HotelDetailParams,
  HotelDetailResponse,
  HotelInitBookParams,
  HotelInitBookResponse,
  HotelInitStaff,
  HotelListItem,
  HotelListParams,
  HotelListResponse,
  HotelOrderBookDto,
  HotelType,
  HotelPolicyParams,
  HotelPolicyColor,
  HotelPolicyItem,
  HotelPolicyPassengerResult,
  HotelPolicyResponse,
  HotelRoom,
  HotelRoomDetailItem,
  HotelRoomPlan,
  OrderDetailParams,
  OrderDetailProductType,
  OrderDetailResponse,
  HotelCancelParams,
  HotelOrderActionFlags,
  HotelOrderBillLine,
  HotelOrderDetail,
  HotelOrderHistory,
  HotelOrderRoom,
  HotelOrderRoomVariables,
  HotelOrderSmsAction,
  HotelOrderSmsConfirmParams,
  HotelOrderSmsParams,
  HotelOrderTraveler,
  OrderPayChannel,
  PayCreateParams,
  PayCreateResponse,
  PayTotalAmountParams,
  PayTotalAmountResponse,
} from "./hotel.js";

export type { HotelCity, HotelCityResourceResponse } from "./hotel-city.js";

export type {
  CredentialFormMode,
  CredentialFormValues,
  CredentialPayload,
  StaffCredentialsParams,
  TmcInfo,
} from "./credential.js";
export {
  CREDENTIAL_TYPE_LABELS,
  CREDENTIAL_TYPE_OPTIONS,
  LEGACY_MEMBER_CREDENTIAL_TYPE_OPTIONS,
  isIdCardType,
  inferCredentialTypeLabelFromMaskedNumber,
  PASSENGER_TYPE_ADULT,
  PASSENGER_TYPE_LABELS,
  PassengerType,
} from "./credential.js";
export type {
  MemberCredentialApiPayload,
  ExternalPassengerApiPayload,
  StaffCredentialApiPayload,
} from "./credential.js";

export type {
  MemberPassenger,
  MemberProfile,
  PassengerListParams,
  PassengerListResponse,
} from "./member.js";

export {
  CredentialType,
  ProductType,
  PRODUCT_TYPE_LABEL,
  blockedCredentialTypes,
  credentialDisplayNumber,
  credentialDisplayType,
  credentialKey,
  credentialTypeValue,
  maskCredentialNumber,
  maxPassengersForProduct,
  memberToCredential,
  parseProductType,
  staffPrimaryCredential,
  toHotelBookPassenger,
} from "./passenger.js";
export type {
  PassengerBookInfo,
  PassengerCredential,
  StaffListParams,
  StaffListResponse,
  StaffPassenger,
} from "./passenger.js";

export { OrderListTabId } from "./order.js";
export type {
  OrderAction,
  OrderActionKind,
  OrderCarListItem,
  OrderFlightListItem,
  OrderHotelListItem,
  OrderListItem,
  OrderListItemBase,
  OrderListParams,
  OrderListResponse,
  OrderListScope,
  OrderListType,
  OrderTrainListItem,
  PayProcessParams,
  PayProcessResponse,
} from "./order.js";

export type {
  GetTravelUrlParams,
  GetTravelUrlResult,
  StaffDto,
  TravelFormDto,
  TravelFormListParams,
  TravelFormListResponse,
  TravelUrlRow,
  TravelUrlTravelType,
} from "./travel.js";

export type {
  TrainBedInfo,
  TrainFilterCondition,
  TrainFilterOption,
  TrainItem,
  TrainSearchParams,
  TrainSearchResponse,
  TrainScheduleParams,
  TrainScheduleResponse,
  TrainScheduleStop,
  TrainSeat,
  TrainSortKind,
  TrainSortTab,
  TrainDurationSortMode,
  TrainPriceSortMode,
  TrainStation,
  TrainStationResourceResponse,
  TrainTypeFilter,
} from "./train.js";
export { parseTrainDurationMinutes, parseTravelTimeMinutes } from "./train.js";

export {
  TrainSeatType,
  TRAIN_SELECTABLE_SEAT_TYPES,
  canSelectTrainSeatType,
} from "./train-policy.js";
export type {
  TrainBookPolicy,
  TrainPolicyColor,
  TrainPolicyParams,
  TrainPolicyPassengerResult,
  TrainPolicyResponse,
} from "./train-policy.js";

export type {
  TrainAccountNumber12306,
  TrainBookCredential,
  TrainBookEntityDto,
  TrainBookLinkmanDto,
  TrainBookParams,
  TrainBookPassengerDto,
  TrainBookResponse,
  TrainBookSeatDto,
  TrainBookSelectionPolicy,
  TrainInitBookParams,
  TrainInitBookResponse,
  TrainOrderBookDto,
} from "./train-book.js";

export type {
  BookCostCenterOption,
  BookOrganizationOption,
  FlightAuthorizedContact,
  FlightBookLinkmanDto,
  FlightBookParams,
  FlightBookPassengerDto,
  FlightBookResponse,
  FlightInitBookParams,
  FlightInitBookResponse,
  FlightInitStaff,
  FlightInitStaffApprover,
  FlightInsuranceProduct,
  FlightOrderBookDto,
  FlightOutNumberField,
  FlightPassengerBookForm,
  FlightPassengerContactOption,
  FlightTmcAgent,
  SearchApprovalOption,
  SearchLinkmanOption,
} from "./flight-book.js";

export type {
  FlightAbolishTicketParams,
  FlightCancelParams,
  FlightOrderTicket,
  FlightOrderTrip,
  OrderContact,
  OrderDetailTicket,
} from "./flight-order.js";

export type {
  TrainCancelParams,
  TrainExchangeInfo,
  TrainExchangeInfoParams,
  TrainIssueParams,
  TrainOrderTicket,
  TrainOrderTrip,
  TrainPassengerInfo,
  TrainPassengerInfoParams,
  TrainRefundParams,
  TrainTicketActionFlags,
} from "./train-order.js";

export type {
  FlightBookPolicy,
  FlightPolicyParams,
  FlightPolicyPassengerResult,
} from "./flight-policy.js";

export type {
  AirportResourceParams,
  AirportResourceResponse,
  FlightCabinTab,
  FlightDetailParams,
  FlightDetailResult,
  FlightFare,
  FlightFareBasic,
  FlightFareRule,
  FlightFareVariables,
  FlightFilterCondition,
  FlightFilterOption,
  FlightListResult,
  FlightListView,
  FlightSearchParams,
  FlightSegment,
  FlightSortTab,
  Trafficline,
} from "./flight.js";

export type { TrafficlineDto } from "./resource.js";

/** Pagination metadata shared across list endpoints. */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
}

/** Credentials for login. */
export interface LoginRequest {
  username: string;
  password: string;
}

/** Authenticated user profile. */
export interface UserDto {
  id: string;
  username: string;
  displayName: string;
}

/** Login response payload. */
export interface LoginResponse {
  user: UserDto;
  accessToken: string;
}
