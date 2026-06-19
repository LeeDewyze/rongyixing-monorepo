/** Generic API response wrapper for backend DTOs. */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export type {
  ApiConfigSetting,
  ApiMode,
  ApiResult,
  IResponse,
  ProxySendOptions,
} from "./proxy.js";

export type {
  DeviceLoginParams,
  IdentityDto,
  LoginResultDto,
  MobileLoginParams,
  PasswordLoginParams,
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
  HotelPolicyParams,
  HotelPolicyResponse,
  OrderDetailParams,
  OrderDetailResponse,
  OrderPayChannel,
  PayCreateParams,
  PayCreateResponse,
} from "./hotel.js";

export type {
  MemberPassenger,
  MemberProfile,
  PassengerListParams,
  PassengerListResponse,
} from "./member.js";

export type {
  OrderListItem,
  OrderListParams,
  OrderListResponse,
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
