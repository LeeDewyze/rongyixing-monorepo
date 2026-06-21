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
}

export interface HotelRoomPlan {
  PlanId: string;
  PlanName: string;
  Price: number;
  Breakfast?: string;
  CancelPolicy?: string;
}

export interface HotelRoom {
  RoomId: string;
  RoomName: string;
  Plans: HotelRoomPlan[];
}

export interface HotelDetailResponse {
  HotelId: string;
  HotelName: string;
  Address?: string;
  Star?: number;
  ImageUrls?: string[];
  Rooms?: HotelRoom[];
}

export interface HotelPolicyParams {
  HotelId: string;
  PlanId?: string;
  CheckInDate?: string;
  CheckOutDate?: string;
}

export interface HotelPolicyResponse {
  IsIllegal?: boolean;
  IllegalMessage?: string;
  Policies?: string[];
}

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
