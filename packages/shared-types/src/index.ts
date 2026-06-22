/** Generic API response wrapper for backend DTOs. */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export type { ApiConfigSetting, ApiMode, ApiResult, IResponse, ProxySendOptions } from "./proxy.js";

export type {
  DeviceLoginParams,
  IdentityDto,
  LoginResultDto,
  MobileLoginParams,
  PasswordLoginParams,
  WebSocketUrlDto,
} from "./auth-proxy.js";

export type {
  HotelBookParams,
  HotelBookPassenger,
  HotelBookResponse,
  HotelDetailParams,
  HotelDetailResponse,
  HotelInitBookParams,
  HotelInitBookResponse,
  HotelListItem,
  HotelListParams,
  HotelListResponse,
  HotelType,
  HotelPolicyParams,
  HotelPolicyResponse,
  OrderDetailParams,
  OrderDetailResponse,
  OrderPayChannel,
  PayCreateParams,
  PayCreateResponse,
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
  TrainFilterCondition,
  TrainFilterOption,
  TrainItem,
  TrainSearchParams,
  TrainSearchResponse,
  TrainSeat,
  TrainSortKind,
  TrainSortTab,
  TrainStation,
  TrainStationResourceResponse,
  TrainTypeFilter,
} from "./train.js";

export type {
  AirportResourceParams,
  AirportResourceResponse,
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
