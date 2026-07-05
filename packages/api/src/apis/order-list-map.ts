import {
  OrderListTabId,
  type OrderAction,
  type OrderFlightListTicket,
  type OrderHotelListItem,
  type OrderListItem,
  type OrderListParams,
  type OrderListResponse,
  type OrderListScope,
  type OrderTrainListTicket,
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

/** Legacy Travel-List: 1-based PageIndex, no lowercase pageIndex, Type on RequestEntity root. */
export function buildTravelListRequest(params: OrderListParams): {
  data: LegacyRecord;
  requestType?: OrderListType;
} {
  const base = buildOrderListRequest(params);
  const legacyPageIndex = (params.PageIndex ?? 0) + 1;
  const data: LegacyRecord = {
    ...base,
    PageIndex: legacyPageIndex,
  };
  delete data.pageIndex;

  const requestType = typeof data.Type === "string" ? (data.Type as OrderListType) : undefined;

  return { data, requestType };
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
  const actions: OrderAction[] = [];
  if (!variables) {
    return [];
  }
  if (variables.isShowCancelButton) {
    actions.push({ kind: "cancel", label: "取消" });
  }
  if (variables.isShowRefundButton) {
    actions.push({ kind: "refund", label: "退票" });
  }
  if (variables.isShowExchangeButton) {
    actions.push({ kind: "exchange", label: "改签" });
  }
  if ((tag === "flight" || tag === "train") && variables.isPay) {
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
    OrderHotelId: readString(hotel.Id) || undefined,
    HotelName: readString(hotel.HotelName ?? hotel.Name),
    CheckInDate: formatDateOnly(hotel.BeginDate ?? hotel.CheckInDate),
    CheckOutDate: formatDateOnly(hotel.EndDate ?? hotel.CheckOutDate),
    Nights: readNumber(hotel.countDay ?? hotel.Nights) ?? 1,
    RoomType: readString(hotel.RoomName ?? hotel.RoomType),
    PassengerNames: passengerNames,
    Actions: buildActions(variables),
  };
}

function mapLegacyFlightTicketForList(ticket: LegacyRecord): OrderFlightListTicket | null {
  const trips = asArray<LegacyRecord>(ticket.OrderFlightTrips);
  const trip = trips[0];
  if (!trip) {
    return null;
  }

  const ticketVariables = parseVariablesObj(ticket);
  const passengerNames =
    joinNames(
      trips.map((item) => {
        const ticketRef = asRecord(item.OrderFlightTicket);
        const passenger = asRecord(ticketRef?.Passenger) ?? asRecord(ticket.Passenger);
        return readString(passenger?.Name);
      }),
    ) || readString(asRecord(ticket.Passenger)?.Name);

  return {
    TicketId: readString(ticket.Id),
    RouteTitle:
      `${readString(trip.FlightNumber)} ${readString(trip.FromCityName)}—${readString(trip.ToCityName)}`.trim(),
    DepartTime: formatDateTime(trip.TakeoffTime ?? trip.DepartTime),
    PassengerNames: passengerNames,
    TicketStatusName:
      readString(ticket.AppStatusName ?? ticket.StatusName ?? ticket.Status) || undefined,
    Actions: buildFlightTrainActions(ticketVariables, "flight"),
    IsCustomApplyRefunding: Boolean(ticketVariables?.isCustomApplyRefunding),
    IsCustomApplyExchanging: Boolean(ticketVariables?.isCustomApplyExchanging),
    TicketType: readString(ticket.TicketType) || readNumber(ticket.TicketType),
  };
}

function mapLegacyFlightOrder(order: LegacyRecord): OrderListItem | null {
  const tickets = asArray<LegacyRecord>(order.OrderFlightTickets);
  const visibleTickets = filterRawFlightTicketsForList(tickets);
  if (visibleTickets.length === 0) {
    return null;
  }

  const ticket = visibleTickets[0];
  const trips = asArray<LegacyRecord>(ticket.OrderFlightTrips);
  const trip = trips[0];
  if (!trip) {
    return null;
  }

  const variables = parseVariablesObj(order);
  const ticketVariables = parseTicketVariablesObj(ticket);
  const listTickets = visibleTickets
    .map(mapLegacyFlightTicketForList)
    .filter((item): item is OrderFlightListTicket => Boolean(item?.TicketId));
  const firstListTicket = listTickets[0];
  const passengerNames =
    joinNames(listTickets.map((item) => item.PassengerNames)) ||
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
      firstListTicket?.RouteTitle ??
      `${readString(trip.FlightNumber)} ${readString(trip.FromCityName)}—${readString(trip.ToCityName)}`.trim(),
    DepartTime: firstListTicket?.DepartTime ?? formatDateTime(trip.TakeoffTime ?? trip.DepartTime),
    PassengerNames: passengerNames,
    TicketStatusName:
      firstListTicket?.TicketStatusName ??
      (readString(ticket.AppStatusName ?? ticket.StatusName ?? ticket.Status) || undefined),
    TicketId: firstListTicket?.TicketId ?? (readString(ticket.Id) || undefined),
    Tickets: listTickets,
    Actions:
      listTickets.length > 0
        ? buildActions(variables)
        : buildFlightTrainActions(ticketVariables ?? variables, "flight"),
  };
}

function parseTicketVariablesObj(ticket: LegacyRecord): LegacyRecord | undefined {
  if (asRecord(ticket.VariablesObj)) {
    return ticket.VariablesObj as LegacyRecord;
  }
  const variables = ticket.Variables;
  if (typeof variables === "string" && variables.trim()) {
    try {
      return JSON.parse(variables) as LegacyRecord;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function isLegacyTruthy(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

/** Legacy order-item_ryx: `.filter((it) => it.VariablesObj.isShow)` — absent isShow is hidden. */
function resolveLegacyListTicketVisible(ticket: LegacyRecord): boolean {
  const ticketVariables = parseTicketVariablesObj(ticket);
  if (!ticketVariables || !("isShow" in ticketVariables)) {
    return false;
  }
  return isLegacyTruthy(ticketVariables.isShow);
}

/** Failed exchange / scrapped replacement tickets (H5 safety when API isShow is stale). */
function isFailedExchangeTrainTicket(
  ticket: LegacyRecord,
  ticketVariables?: LegacyRecord,
): boolean {
  const vars = ticketVariables ?? parseTicketVariablesObj(ticket);
  const originalTicketId = readString(vars?.OriginalTicketId);
  if (!originalTicketId) {
    return false;
  }

  const status = readString(ticket.Status);
  if (
    status === "15" ||
    status === "Abolish" ||
    status === "16" ||
    status === "Exception" ||
    status === "17" ||
    status === "ExchangeAbolishing"
  ) {
    return true;
  }

  const label = readString(ticket.AppStatusName ?? ticket.StatusName);
  return /出票失败|废除|作废|失败/.test(label);
}

function shouldShowTrainTicketInList(ticket: LegacyRecord): boolean {
  if (!resolveLegacyListTicketVisible(ticket)) {
    return false;
  }

  if (isFailedExchangeTrainTicket(ticket)) {
    return false;
  }

  return true;
}

function shouldShowFlightTicketInList(ticket: LegacyRecord): boolean {
  return resolveLegacyListTicketVisible(ticket);
}

function filterRawTrainTicketsForList(rawTickets: LegacyRecord[]): LegacyRecord[] {
  return rawTickets.filter(shouldShowTrainTicketInList);
}

function filterRawFlightTicketsForList(rawTickets: LegacyRecord[]): LegacyRecord[] {
  return rawTickets.filter(shouldShowFlightTicketInList);
}

function isTerminalTrainListTicketStatus(status: string): boolean {
  return /退票|已取消|作废|废除|出票失败|失败/.test(status);
}

function dedupeTrainListTickets(tickets: OrderTrainListTicket[]): OrderTrainListTicket[] {
  const active: OrderTrainListTicket[] = [];
  const terminalByKey = new Map<string, OrderTrainListTicket>();

  for (const ticket of tickets) {
    const status = ticket.TicketStatusName ?? "";
    const isTerminal = isTerminalTrainListTicketStatus(status);
    if (!isTerminal) {
      active.push(ticket);
      continue;
    }

    const key = `${ticket.PassengerNames}|${ticket.RouteTitle}|${status}`;
    const existing = terminalByKey.get(key);
    if (!existing || Number(ticket.TicketId) > Number(existing.TicketId)) {
      terminalByKey.set(key, ticket);
    }
  }

  const byIdDesc = (a: OrderTrainListTicket, b: OrderTrainListTicket) =>
    Number(b.TicketId) - Number(a.TicketId) || b.TicketId.localeCompare(a.TicketId);

  return [...active, ...terminalByKey.values()].sort(byIdDesc);
}

function mapLegacyTrainTicketForList(ticket: LegacyRecord): OrderTrainListTicket | null {
  const trips = asArray<LegacyRecord>(ticket.OrderTrainTrips);
  const trip = trips[0];
  if (!trip) {
    return null;
  }

  const ticketVariables = parseVariablesObj(ticket);
  const passengerNames =
    joinNames(
      trips.map((item) => {
        const ticketRef = asRecord(item.OrderTrainTicket);
        const passenger = asRecord(ticketRef?.Passenger) ?? asRecord(ticket.Passenger);
        return readString(passenger?.Name);
      }),
    ) || readString(asRecord(ticket.Passenger)?.Name);

  return {
    TicketId: readString(ticket.Id),
    RouteTitle:
      `${readString(trip.TrainCode)} ${readString(trip.FromStationName)}—${readString(trip.ToStationName)}`.trim(),
    DepartTime: formatDateTime(trip.StartTime ?? trip.DepartureTime ?? trip.GoDate),
    PassengerNames: passengerNames,
    TicketStatusName:
      readString(ticket.AppStatusName ?? ticket.StatusName ?? ticket.Status) || undefined,
    Actions: buildFlightTrainActions(ticketVariables, "train"),
  };
}

function mapLegacyTrainOrder(order: LegacyRecord): OrderListItem | null {
  const tickets = asArray<LegacyRecord>(order.OrderTrainTickets);
  const visibleTickets = filterRawTrainTicketsForList(tickets);
  if (visibleTickets.length === 0) {
    return null;
  }

  const ticket = visibleTickets[0];
  const trips = asArray<LegacyRecord>(ticket.OrderTrainTrips);
  const trip = trips[0];
  if (!trip) {
    return null;
  }

  const variables = parseVariablesObj(order);
  const ticketVariables = parseTicketVariablesObj(ticket);
  const listTickets = dedupeTrainListTickets(
    visibleTickets
      .map(mapLegacyTrainTicketForList)
      .filter((item): item is OrderTrainListTicket => Boolean(item?.TicketId)),
  );
  const firstListTicket = listTickets[0];
  const passengerNames =
    joinNames(listTickets.map((item) => item.PassengerNames)) ||
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
      firstListTicket?.RouteTitle ??
      `${readString(trip.TrainCode)} ${readString(trip.FromStationName)}—${readString(trip.ToStationName)}`.trim(),
    DepartTime:
      firstListTicket?.DepartTime ??
      formatDateTime(trip.StartTime ?? trip.DepartureTime ?? trip.GoDate),
    PassengerNames: passengerNames,
    TicketStatusName:
      firstListTicket?.TicketStatusName ??
      (readString(ticket.AppStatusName ?? ticket.StatusName ?? ticket.Status) || undefined),
    TicketId: firstListTicket?.TicketId ?? (readString(ticket.Id) || undefined),
    Tickets: listTickets,
    Actions:
      listTickets.length > 0
        ? buildActions(variables)
        : buildFlightTrainActions(ticketVariables ?? variables, "train"),
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

function resolveTravelTripAmount(trip: LegacyRecord): number | undefined {
  const variables = parseVariablesObj(trip);
  const orderTrainTicket = asRecord(trip.OrderTrainTicket);
  const order = asRecord(trip.Order);

  return (
    readNumber(trip.TotalAmount) ??
    readNumber(trip.Price) ??
    readNumber(trip.TicketPrice) ??
    readNumber(trip.SalesPrice) ??
    readNumber(trip.Amount) ??
    readNumber(trip.PayAmount) ??
    readNumber(trip.vmTicketAmount) ??
    readNumber(orderTrainTicket?.TicketPrice) ??
    readNumber(orderTrainTicket?.Price) ??
    readNumber(order?.TotalAmount) ??
    readNumber(order?.PayAmount) ??
    readNumber(variables?.totalAmount) ??
    readNumber(variables?.TotalAmount) ??
    readNumber(variables?.ticketPrice) ??
    readNumber(variables?.TicketPrice) ??
    readNumber(variables?.vmTicketAmount)
  );
}

function buildTravelTrainRouteTitle(trip: LegacyRecord): string {
  const trainCode = readString(trip.Number ?? trip.Name ?? trip.TrainCode);
  const from = readString(trip.FromName ?? trip.FromStationName ?? trip.FromCityName);
  const to = readString(trip.ToName ?? trip.ToStationName ?? trip.ToCityName);
  if (from && to) {
    return `${trainCode} ${from}—${to}`.trim();
  }
  return readString(trip.Name) || trainCode;
}

function buildTravelFlightRouteTitle(trip: LegacyRecord): string {
  const flightNo = readString(trip.Number ?? trip.Name ?? trip.FlightNumber);
  const from = readString(trip.FromName ?? trip.FromCityName ?? trip.FromAirportName);
  const to = readString(trip.ToName ?? trip.ToCityName ?? trip.ToAirportName);
  if (from && to) {
    return `${flightNo} ${from}—${to}`.trim();
  }
  return readString(trip.Name) || flightNo;
}

function buildTravelDepartTime(trip: LegacyRecord): string {
  return formatDateTime(trip["goDate"] ?? trip.StartTime ?? trip.DepartureTime ?? trip.TakeoffTime);
}

function isLikelyTicketStatus(status: string): boolean {
  return /已出票|改签|退票|待出票|预订|出票|废除|作废|取消/.test(status);
}

function resolveTravelOrderStatusName(trip: LegacyRecord): string {
  const explicit = readString(trip.StatusName ?? trip.OrderStatusName);
  if (explicit) {
    return explicit;
  }
  const status = readString(trip.Status);
  if (status && !isLikelyTicketStatus(status)) {
    return status;
  }
  return "待出行";
}

function resolveTravelTicketStatusName(trip: LegacyRecord): string | undefined {
  const explicit = readString(trip.AppStatusName ?? trip.TicketStatus);
  if (explicit) {
    return explicit;
  }
  const status = readString(trip.Status);
  return status && isLikelyTicketStatus(status) ? status : undefined;
}

function mapLegacyTrainTrip(trip: LegacyRecord): OrderListItem {
  const variables = parseVariablesObj(trip);
  const passengerName = readString(asRecord(trip.Passenger)?.Name);
  const routeTitle = buildTravelTrainRouteTitle(trip);
  const departTime = buildTravelDepartTime(trip);
  const ticketStatusName = resolveTravelTicketStatusName(trip);
  const ticketId = readString(trip.OrderTicketId ?? trip.TicketId ?? trip.Id);
  const listTicket: OrderTrainListTicket = {
    TicketId: ticketId,
    RouteTitle: routeTitle,
    DepartTime: departTime,
    PassengerNames: passengerName,
    TicketStatusName: ticketStatusName,
    Actions: buildFlightTrainActions(variables, "train"),
  };

  return {
    tabId: OrderListTabId.Train,
    OrderId: readString(trip.OrderId ?? trip.Id),
    OrderNumber: readString(trip.OrderId ?? trip.Id),
    Status: readString(trip.OrderStatus ?? trip.Status),
    StatusName: resolveTravelOrderStatusName(trip),
    TotalAmount: resolveTravelTripAmount(trip),
    RouteTitle: routeTitle,
    DepartTime: departTime,
    PassengerNames: passengerName,
    TicketStatusName: ticketStatusName,
    TicketId: ticketId || undefined,
    Tickets: [listTicket],
    Actions: [],
  };
}

function mapLegacyFlightTrip(trip: LegacyRecord): OrderListItem {
  const variables = parseVariablesObj(trip);
  const passengerName = readString(asRecord(trip.Passenger)?.Name);
  const routeTitle = buildTravelFlightRouteTitle(trip);
  const departTime = buildTravelDepartTime(trip);
  const ticketStatusName = resolveTravelTicketStatusName(trip);
  const ticketId = readString(trip.OrderTicketId ?? trip.TicketId ?? trip.Id);
  const listTicket: OrderFlightListTicket = {
    TicketId: ticketId,
    RouteTitle: routeTitle,
    DepartTime: departTime,
    PassengerNames: passengerName,
    TicketStatusName: ticketStatusName,
    Actions: buildFlightTrainActions(variables, "flight"),
    IsCustomApplyRefunding: Boolean(variables?.isCustomApplyRefunding),
    IsCustomApplyExchanging: Boolean(variables?.isCustomApplyExchanging),
  };

  return {
    tabId: OrderListTabId.Flight,
    OrderId: readString(trip.OrderId ?? trip.Id),
    OrderNumber: readString(trip.OrderId ?? trip.Id),
    Status: readString(trip.OrderStatus ?? trip.Status),
    StatusName: resolveTravelOrderStatusName(trip),
    TotalAmount: resolveTravelTripAmount(trip),
    RouteTitle: routeTitle,
    DepartTime: departTime,
    PassengerNames: passengerName,
    TicketStatusName: ticketStatusName,
    TicketId: ticketId || undefined,
    Tickets: [listTicket],
    Actions: [],
  };
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
    return mapLegacyFlightTrip(trip);
  }

  if (resolvedTabId === OrderListTabId.Train) {
    return mapLegacyTrainTrip(trip);
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
