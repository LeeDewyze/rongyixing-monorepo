/** RYX order list tab ids (tmc-order-list_ryx ?tabId=). Not the same as ProductType. */
export enum OrderListTabId {
  Flight = 1,
  Train = 2,
  Hotel = 3,
  Car = 7,
}

export type OrderListScope = "all" | "pendingTravel";

export type OrderListType = "Flight" | "Train" | "Hotel" | "Car" | "RentalCar";

export type OrderActionKind = "cancel" | "pay" | "refund" | "exchange";

export interface OrderAction {
  kind: OrderActionKind;
  label: string;
}

export interface OrderFlightListTicket {
  TicketId: string;
  RouteTitle: string;
  DepartTime: string;
  PassengerNames: string;
  TicketStatusName?: string;
  Actions?: OrderAction[];
  IsCustomApplyRefunding?: boolean;
  IsCustomApplyExchanging?: boolean;
  TicketType?: string | number;
}

export interface OrderTrainListTicket {
  TicketId: string;
  RouteTitle: string;
  DepartTime: string;
  PassengerNames: string;
  TicketStatusName?: string;
  Actions?: OrderAction[];
}

export interface OrderListParams {
  TabId?: OrderListTabId;
  /** Legacy Order-List product type (ryx sends Type: "Hotel" etc.). */
  Type?: OrderListType;
  Scope?: OrderListScope;
  PageIndex?: number;
  PageSize?: number;
  Status?: string;
  Keyword?: string;
}

export interface OrderListItemBase {
  OrderId: string;
  OrderNumber?: string;
  Status: string;
  StatusName: string;
  TotalAmount?: number;
  Actions?: OrderAction[];
  CreateTime?: string;
}

export interface OrderFlightListItem extends OrderListItemBase {
  tabId: OrderListTabId.Flight;
  RouteTitle: string;
  DepartTime: string;
  PassengerNames: string;
  TicketStatusName?: string;
  /** First ticket id — used for refund from list/detail handoff. */
  TicketId?: string;
  Tickets?: OrderFlightListTicket[];
}

export interface OrderTrainListItem extends OrderListItemBase {
  tabId: OrderListTabId.Train;
  RouteTitle: string;
  DepartTime: string;
  PassengerNames: string;
  TicketStatusName?: string;
  /** First ticket id — used for refund/exchange from list. */
  TicketId?: string;
  Tickets?: OrderTrainListTicket[];
}

export interface OrderHotelListItem extends OrderListItemBase {
  tabId: OrderListTabId.Hotel;
  /** First room id — used for hotel cancellation from list. */
  OrderHotelId?: string;
  HotelName: string;
  CheckInDate: string;
  CheckOutDate: string;
  Nights: number;
  RoomType: string;
  PassengerNames: string;
}

export interface OrderCarListItem extends OrderListItemBase {
  tabId: OrderListTabId.Car;
  /** Placeholder for future car order fields. */
  ServiceTitle?: string;
}

export type OrderListItem =
  | OrderFlightListItem
  | OrderTrainListItem
  | OrderHotelListItem
  | OrderCarListItem;

export interface OrderListResponse {
  Orders: OrderListItem[];
  TotalCount?: number;
}

export interface PayProcessParams {
  OrderId?: string;
  PayOrderId?: string;
  PayType?: string;
  OutTradeNo?: string;
  Type?: string;
}

export interface PayProcessResponse {
  Success?: boolean;
  Message?: string;
}
