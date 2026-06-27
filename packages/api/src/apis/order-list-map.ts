import {
  OrderListTabId,
  type OrderAction,
  type OrderHotelListItem,
  type OrderListItem,
  type OrderListParams,
  type OrderListResponse,
  type OrderListScope,
} from "@ryx/shared-types";

export type OrderListType = "Flight" | "Train" | "Hotel" | "Car" | "RentalCar";

const TAB_ID_TO_TYPE: Record<OrderListTabId, OrderListType> = {
  [OrderListTabId.Flight]: "Flight",
  [OrderListTabId.Train]: "Train",
  [OrderListTabId.Hotel]: "Hotel",
  [OrderListTabId.Car]: "Car",
};

const TYPE_TO_TAB_ID: Record<OrderListType, OrderListTabId> = {
  Flight: OrderListTabId.Flight,
  Train: OrderListTabId.Train,
  Hotel: OrderListTabId.Hotel,
  Car: OrderListTabId.Car,
  RentalCar: OrderListTabId.Car,
};

type LegacyRecord = Record<string, unknown>;

export function orderListTabIdToType(tabId: OrderListTabId): OrderListType {
  return TAB_ID_TO_TYPE[tabId];
}

export function orderListTypeToTabId(type: string): OrderListTabId | undefined {
  return TYPE_TO_TAB_ID[type as OrderListType];
}

export function resolveOrderListTabId(params: OrderListParams): OrderListTabId | undefined {
  if (params.TabId != null) {
    return params.TabId;
  }
  if (params.Type) {
    return orderListTypeToTabId(params.Type);
  }
  return undefined;
}

/** Legacy Order-List / Travel-List request body (ryx tmc-order.service). */
export function buildOrderListRequest(params: OrderListParams): LegacyRecord {
  const pageIndex = params.PageIndex ?? 0;
  const tabId = resolveOrderListTabId(params);
  const type = params.Type ?? (tabId != null ? orderListTabIdToType(tabId) : undefined);

  const data: LegacyRecord = {
    pageIndex,
    PageIndex: pageIndex,
    PageSize: params.PageSize ?? 20,
  };

  if (type) {
    data.Type = type;
  }
  if (params.Status) {
    data.Status = params.Status;
  }
  if (params.Keyword) {
    data.Id = params.Keyword;
  }

  return data;
}

function asRecord(value: unknown): LegacyRecord | null {
  return value && typeof value === "object" ? (value as LegacyRecord) : null;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : value != null ? String(value) : "";
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
  }
  return undefined;
}

function parseVariablesObj(order: LegacyRecord): LegacyRecord | undefined {
  if (asRecord(order.VariablesObj)) {
    return order.VariablesObj as LegacyRecord;
  }
  const variables = order.Variables;
  if (typeof variables === "string" && variables.trim()) {
    try {
      return JSON.parse(variables) as LegacyRecord;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function formatDateTime(value: unknown): string {
  const text = readString(value);
  return text.includes("T") ? text.replace("T", " ").replace(/\.\d+Z?$/, "") : text;
}

function formatDateOnly(value: unknown): string {
  const text = readString(value);
  return text.length >= 10 ? text.slice(0, 10) : text;
}

function joinNames(values: Array<string | undefined>): string {
  return values.filter((name): name is string => Boolean(name)).join("、");
}

function buildActions(variables?: LegacyRecord): OrderAction[] {
  if (!variables) {
    return [];
  }
  const actions: OrderAction[] = [];
  if (variables.isShowCancelButton) {
    actions.push({ kind: "cancel", label: "取消" });
  }
  if (variables.isPay) {
    actions.push({ kind: "pay", label: "支付" });
  }
  return actions;
}

function buildFlightTrainActions(
  variables: LegacyRecord | undefined,
  tag: "flight" | "train",
): OrderAction[] {
  const actions = buildActions(variables);
  if (actions.length > 0) {
    return actions;
  }
  if (!variables) {
    return [];
  }
  if (variables.isShowRefundButton) {
    actions.push({ kind: "refund", label: "退票" });
  }
  if (variables.isShowExchangeButton) {
    actions.push({ kind: "exchange", label: "改签" });
  }
  if (variables.isShowCancelButton) {
    actions.unshift({ kind: "cancel", label: "取消" });
  }
  if (tag === "flight" && variables.isPay) {
    actions.push({ kind: "pay", label: "支付" });
  }
  return actions;
}

function isNormalizedOrder(item: unknown): item is OrderListItem {
  const record = asRecord(item);
  return record != null && typeof record.tabId === "number" && typeof record.OrderId === "string";
}

function mapLegacyHotelOrder(order: LegacyRecord): OrderHotelListItem | null {
  const hotels = asArray<LegacyRecord>(order.OrderHotels);
  const hotel = hotels[0];
  if (!hotel) {
    return null;
  }

  const variables = parseVariablesObj(order);
  const passengerNames =
    joinNames(hotels.map((item) => readString(asRecord(item.Passenger)?.Name))) ||
    joinNames(asArray<LegacyRecord>(order.OrderPassengers).map((item) => readString(item.Name)));

  return {
    tabId: OrderListTabId.Hotel,
    OrderId: readString(order.Id ?? order.OrderId),
    OrderNumber: readString(order.Id ?? order.OrderNumber ?? order.OrderId),
    Status: readString(order.Status),
    StatusName: readString(order.StatusName ?? order.Status),
    TotalAmount: readNumber(order.TotalAmount),
    HotelName: readString(hotel.HotelName ?? hotel.Name),
    CheckInDate: formatDateOnly(hotel.BeginDate ?? hotel.CheckInDate),
    CheckOutDate: formatDateOnly(hotel.EndDate ?? hotel.CheckOutDate),
    Nights: readNumber(hotel.countDay ?? hotel.Nights) ?? 1,
    RoomType: readString(hotel.RoomName ?? hotel.RoomType),
    PassengerNames: passengerNames,
    Actions: buildActions(variables),
  };
}

function mapLegacyFlightOrder(order: LegacyRecord): OrderListItem | null {
  const tickets = asArray<LegacyRecord>(order.OrderFlightTickets);
  const ticket = tickets[0];
  const trips = ticket ? asArray<LegacyRecord>(ticket.OrderFlightTrips) : [];
  const trip = trips[0];
  if (!trip) {
    return null;
  }

  const variables = parseVariablesObj(order);
  const ticketVariables = ticket ? parseVariablesObj(ticket) : undefined;
  const passengerNames =
    joinNames(
      trips.map((item) => {
        const ticketRef = asRecord(item.OrderFlightTicket);
        const passenger = asRecord(ticketRef?.Passenger);
        return readString(passenger?.Name);
      }),
    ) ||
    joinNames(asArray<LegacyRecord>(order.OrderPassengers).map((item) => readString(item.Name)));

  return {
    tabId: OrderListTabId.Flight,
    OrderId: readString(order.Id ?? order.OrderId),
    OrderNumber: readString(order.Id ?? order.OrderNumber ?? order.OrderId),
    Status: readString(order.Status),
    StatusName: readString(order.StatusName ?? order.Status),
    TotalAmount: readNumber(order.TotalAmount),
    RouteTitle:
      `${readString(trip.FlightNumber)} ${readString(trip.FromCityName)}—${readString(trip.ToCityName)}`.trim(),
    DepartTime: formatDateTime(trip.TakeoffTime ?? trip.DepartTime),
    PassengerNames: passengerNames,
    TicketStatusName: readString(ticket?.StatusName ?? ticket?.Status) || undefined,
    Actions: buildFlightTrainActions(ticketVariables ?? variables, "flight"),
  };
}

function mapLegacyTrainOrder(order: LegacyRecord): OrderListItem | null {
  const tickets = asArray<LegacyRecord>(order.OrderTrainTickets);
  const ticket = tickets[0];
  const trips = ticket ? asArray<LegacyRecord>(ticket.OrderTrainTrips) : [];
  const trip = trips[0];
  if (!trip) {
    return null;
  }

  const variables = parseVariablesObj(order);
  const ticketVariables = ticket ? parseVariablesObj(ticket) : undefined;
  const passengerNames =
    joinNames(
      trips.map((item) => {
        const ticketRef = asRecord(item.OrderTrainTicket);
        const passenger = asRecord(ticketRef?.Passenger);
        return readString(passenger?.Name);
      }),
    ) ||
    joinNames(asArray<LegacyRecord>(order.OrderPassengers).map((item) => readString(item.Name)));

  return {
    tabId: OrderListTabId.Train,
    OrderId: readString(order.Id ?? order.OrderId),
    OrderNumber: readString(order.Id ?? order.OrderNumber ?? order.OrderId),
    Status: readString(order.Status),
    StatusName: readString(order.StatusName ?? order.Status),
    TotalAmount: readNumber(order.TotalAmount),
    RouteTitle:
      `${readString(trip.TrainCode)} ${readString(trip.FromStationName)}—${readString(trip.ToStationName)}`.trim(),
    DepartTime: formatDateTime(trip.StartTime ?? trip.DepartureTime ?? trip.GoDate),
    PassengerNames: passengerNames,
    TicketStatusName: readString(ticket?.StatusName ?? ticket?.Status) || undefined,
    TicketId: readString(ticket?.Id) || undefined,
    Actions: buildFlightTrainActions(ticketVariables ?? variables, "train"),
  };
}

function mapLegacyOrder(order: LegacyRecord, tabId: OrderListTabId): OrderListItem | null {
  if (isNormalizedOrder(order)) {
    return order;
  }

  switch (tabId) {
    case OrderListTabId.Hotel:
      return mapLegacyHotelOrder(order);
    case OrderListTabId.Flight:
      return mapLegacyFlightOrder(order);
    case OrderListTabId.Train:
      return mapLegacyTrainOrder(order);
    case OrderListTabId.Car:
      return {
        tabId: OrderListTabId.Car,
        OrderId: readString(order.Id ?? order.OrderId),
        OrderNumber: readString(order.Id ?? order.OrderNumber ?? order.OrderId),
        Status: readString(order.Status),
        StatusName: readString(order.StatusName ?? order.Status),
        TotalAmount: readNumber(order.TotalAmount),
        ServiceTitle: readString(order.Title ?? order.ProductName) || "用车订单",
        Actions: buildActions(parseVariablesObj(order)),
      };
    default:
      return null;
  }
}

function mapLegacyTrip(trip: LegacyRecord, tabId: OrderListTabId): OrderListItem | null {
  const type = readString(trip.Type);
  const resolvedTabId = orderListTypeToTabId(type) ?? tabId;

  if (resolvedTabId === OrderListTabId.Hotel) {
    const start = formatDateOnly(trip.StartTime);
    const end = formatDateOnly(trip.EndTime);
    return {
      tabId: OrderListTabId.Hotel,
      OrderId: readString(trip.OrderId ?? trip.Id),
      OrderNumber: readString(trip.OrderId ?? trip.Id),
      Status: readString(trip.Status),
      StatusName: readString(trip.Status),
      TotalAmount: readNumber(trip.TotalAmount),
      HotelName: readString(trip.Name),
      CheckInDate: start,
      CheckOutDate: end,
      Nights: readNumber(trip.countDay) ?? 1,
      RoomType: readString(trip.RoomName ?? trip.RoomType),
      PassengerNames: readString(asRecord(trip.Passenger)?.Name),
      Actions: [],
    };
  }

  if (resolvedTabId === OrderListTabId.Flight) {
    return {
      tabId: OrderListTabId.Flight,
      OrderId: readString(trip.OrderId ?? trip.Id),
      OrderNumber: readString(trip.OrderId ?? trip.Id),
      Status: readString(trip.Status),
      StatusName: readString(trip.Status),
      TotalAmount: readNumber(trip.TotalAmount),
      RouteTitle: readString(trip.Name),
      DepartTime: formatDateTime(trip.StartTime ?? trip["goDate"]),
      PassengerNames: readString(asRecord(trip.Passenger)?.Name),
      Actions: [],
    };
  }

  if (resolvedTabId === OrderListTabId.Train) {
    return {
      tabId: OrderListTabId.Train,
      OrderId: readString(trip.OrderId ?? trip.Id),
      OrderNumber: readString(trip.OrderId ?? trip.Id),
      Status: readString(trip.Status),
      StatusName: readString(trip.Status),
      TotalAmount: readNumber(trip.TotalAmount),
      RouteTitle: readString(trip.Name),
      DepartTime: formatDateTime(trip.StartTime ?? trip["goDate"]),
      PassengerNames: readString(asRecord(trip.Passenger)?.Name),
      Actions: [],
    };
  }

  return null;
}

function extractPayload(data: unknown): LegacyRecord {
  const root = asRecord(data);
  if (!root) {
    return {};
  }
  if (Array.isArray(root.Orders) || Array.isArray(root.Trips)) {
    return root;
  }
  const nested = asRecord(root.Data);
  return nested ?? root;
}

export function normalizeOrderListResponse(
  data: unknown,
  tabId: OrderListTabId,
): OrderListResponse {
  const payload = extractPayload(data);
  const rawOrders = asArray<unknown>(payload.Orders);
  const orders = rawOrders
    .map((item) => mapLegacyOrder(asRecord(item) ?? {}, tabId))
    .filter((item): item is OrderListItem => item != null);

  const total = readNumber(payload.DataCount) ?? readNumber(payload.TotalCount) ?? orders.length;

  return { Orders: orders, TotalCount: total };
}

export function normalizeTravelListResponse(
  data: unknown,
  tabId: OrderListTabId,
): OrderListResponse {
  const payload = extractPayload(data);
  const rawTrips = asArray<unknown>(payload.Trips);
  const orders = rawTrips
    .map((item) => mapLegacyTrip(asRecord(item) ?? {}, tabId))
    .filter((item): item is OrderListItem => item != null);

  const total = readNumber(payload.DataCount) ?? readNumber(payload.TotalCount) ?? orders.length;

  return { Orders: orders, TotalCount: total };
}

export function isPendingTravelScope(scope?: OrderListScope): boolean {
  return scope === "pendingTravel";
}
