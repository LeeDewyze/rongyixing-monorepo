/** Legacy TMC hotel type filter (list page segment). */
export type HotelType = "Normal" | "Tmc" | "Agent";

/** Hotel list query params. */
export interface HotelListParams {
  CityCode?: string;
  CityName?: string;
  CheckInDate?: string;
  CheckOutDate?: string;
  PageIndex?: number;
  PageSize?: number;
  Keyword?: string;
  /** Legacy list filter: non-negotiated / negotiated / agent special. */
  HotelType?: HotelType;
}

export interface HotelListItem {
  HotelId: string;
  HotelName: string;
  Address?: string;
  Star?: number;
  MinPrice?: number;
  ImageUrl?: string;
  /** e.g. Tmc tag from legacy `Hotel.Tag`. */
  Tags?: string[];
}

export interface HotelListResponse {
  Hotels: HotelListItem[];
  TotalCount?: number;
}

export interface HotelDetailParams {
  HotelId: string;
  CheckInDate?: string;
  CheckOutDate?: string;
  CityCode?: string;
  CityName?: string;
  MinPrice?: number;
  HotelType?: HotelType;
  TravelFormId?: string;
}

/** Policy color keys aligned with legacy hotel detail UI. */
export type HotelPolicyColor =
  | "success"
  | "warning"
  | "danger_disabled"
  | "danger_full"
  | "danger_nopermission";

export interface HotelRoomPlan {
  PlanId: string;
  PlanName: string;
  Price: number;
  Breakfast?: string;
  CancelPolicy?: string;
  /** Legacy RoomPlan.Id (may be "0"). */
  LegacyId?: string;
  SupplierType?: number | string;
  TotalAmount?: number;
  Number?: number | string;
  SupplierNumber?: number | string;
  BeginDate?: string;
  EndDate?: string;
  RoomPlanUniqueId?: string;
  /** Legacy RoomPlan.PaymentType (1 prepaid, 2 pay at hotel, 4 monthly). */
  PaymentType?: number;
  VariablesObj?: Record<string, unknown>;
}

/** Legacy `RoomDetails` row for room detail page. */
export interface HotelRoomDetailItem {
  Label: string;
  Value: string;
  Tag?: string;
}

export interface HotelRoom {
  RoomId: string;
  RoomName: string;
  ImageUrl?: string;
  /** Full-size image URL used when list thumbnail fails to load. */
  ImageUrlFallback?: string;
  /** Room photo count for gallery badge. */
  ImageCount?: number;
  /** Full-size room gallery URLs (legacy room / hotel image index). */
  ImageUrls?: string[];
  /** e.g. "1张1.98米特大床 36m² 2人入住 10-22层" */
  Specs?: string;
  /** Feature tags e.g. 城景, 浴缸 */
  Tags?: string[];
  /** Structured specs from legacy `RoomDetails`. */
  Details?: HotelRoomDetailItem[];
  /** Strikethrough reference price. */
  OriginalPrice?: number;
  /** Tax-inclusive total for display. */
  TotalPrice?: number;
  /** Discount amount badge. */
  DiscountAmount?: number;
  Plans: HotelRoomPlan[];
}

export interface HotelDetailResponse {
  HotelId: string;
  HotelName: string;
  Address?: string;
  Star?: number;
  Phone?: string;
  Lat?: number;
  Lng?: number;
  ImageUrls?: string[];
  Rooms?: HotelRoom[];
  /** e.g. 入住时间：14:00以后 离店时间：12:00以前 */
  CheckInOutTime?: string;
  BookingNotice?: string;
  OpeningDate?: string;
  RenovationDate?: string;
  Introduction?: string;
  CheckInDate?: string;
  CheckOutDate?: string;
  CityCode?: string;
  /** Default room thumbnail from legacy Home-Detail / Home-List. */
  RoomDefaultImg?: string;
}

/** Legacy Home-Policy request body. */
export interface HotelPolicyParams {
  RoomPlans: string;
  Passengers: string;
  CityCode: string;
  TravelFromId?: string;
}

export interface HotelPolicyItem {
  UniqueIdId?: string;
  IsAllowBook?: boolean;
  Rules?: string[];
}

export interface HotelPolicyPassengerResult {
  PassengerKey?: string;
  HotelPolicies?: HotelPolicyItem[];
}

export type HotelPolicyResponse = HotelPolicyPassengerResult[];

export interface HotelBookPassenger {
  Name: string;
  Mobile?: string;
  CredentialNo?: string;
  CredentialType?: string;
  travelFormId?: string;
}

export interface HotelInitBookParams {
  HotelId: string;
  PlanId: string;
  CheckInDate: string;
  CheckOutDate: string;
  RoomCount?: number;
  Passengers?: HotelBookPassenger[];
  TravelFormId?: string;
}

export interface HotelInitBookResponse {
  OrderAmount?: number;
  ServiceFees?: Record<string, number>;
  IllegalReasons?: string[];
  ExpenseTypes?: { Id: string; Name: string; Tag?: string }[];
  Staffs?: { Id: string; Name: string }[];
}

export interface HotelBookParams extends HotelInitBookParams {
  Passengers: HotelBookPassenger[];
  ContactName?: string;
  ContactMobile?: string;
}

export interface HotelBookResponse {
  OrderId: string;
  OrderNumber?: string;
}

export interface OrderDetailParams {
  OrderId: string;
}

export interface OrderDetailResponse {
  OrderId: string;
  OrderNumber?: string;
  Status?: string;
  StatusName?: string;
  isShowPayButton?: boolean;
  TotalAmount?: number;
  HotelName?: string;
  CheckInDate?: string;
  CheckOutDate?: string;
}

export interface OrderPayChannel {
  PayType: string;
  PayTypeName: string;
  Icon?: string;
}

export interface PayCreateParams {
  OrderId: string;
  PayType: string;
  Amount?: number;
}

export interface PayCreateResponse {
  PayUrl?: string;
  PayOrderId?: string;
}
