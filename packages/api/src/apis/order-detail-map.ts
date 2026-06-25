import type { OrderDetailProductType, OrderDetailResponse } from "@ryx/shared-types";

type LegacyRecord = Record<string, unknown>;

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

function isNormalizedDetail(data: LegacyRecord): boolean {
  return typeof data.OrderId === "string" && typeof data.ProductType === "string";
}

function readPayButton(variables?: LegacyRecord, fallback?: boolean): boolean | undefined {
  if (variables?.isPay != null) {
    return Boolean(variables.isPay);
  }
  return fallback;
}

function mapFlightDetail(order: LegacyRecord): OrderDetailResponse | null {
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
    OrderId: readString(order.Id ?? order.OrderId),
    OrderNumber: readString(order.Id ?? order.OrderNumber ?? order.OrderId),
    Status: readString(order.Status),
    StatusName: readString(order.StatusName ?? order.Status),
    TotalAmount: readNumber(order.TotalAmount),
    ProductType: "Flight",
    RouteTitle:
      `${readString(trip.FlightNumber)} ${readString(trip.FromCityName)}—${readString(trip.ToCityName)}`.trim(),
    DepartTime: formatDateTime(trip.TakeoffTime ?? trip.DepartTime),
    PassengerNames: passengerNames,
    TicketStatusName: readString(ticket?.StatusName ?? ticket?.Status) || undefined,
    isShowPayButton: readPayButton(ticketVariables ?? variables),
  };
}

function mapHotelDetail(order: LegacyRecord): OrderDetailResponse | null {
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
    OrderId: readString(order.Id ?? order.OrderId),
    OrderNumber: readString(order.Id ?? order.OrderNumber ?? order.OrderId),
    Status: readString(order.Status),
    StatusName: readString(order.StatusName ?? order.Status),
    TotalAmount: readNumber(order.TotalAmount),
    ProductType: "Hotel",
    HotelName: readString(hotel.HotelName ?? hotel.Name),
    CheckInDate: formatDateOnly(hotel.BeginDate ?? hotel.CheckInDate),
    CheckOutDate: formatDateOnly(hotel.EndDate ?? hotel.CheckOutDate),
    PassengerNames: passengerNames,
    isShowPayButton: readPayButton(variables),
  };
}

function mapTrainDetail(order: LegacyRecord): OrderDetailResponse | null {
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
    OrderId: readString(order.Id ?? order.OrderId),
    OrderNumber: readString(order.Id ?? order.OrderNumber ?? order.OrderId),
    Status: readString(order.Status),
    StatusName: readString(order.StatusName ?? order.Status),
    TotalAmount: readNumber(order.TotalAmount),
    ProductType: "Train",
    RouteTitle:
      `${readString(trip.TrainCode)} ${readString(trip.FromStationName)}—${readString(trip.ToStationName)}`.trim(),
    DepartTime: formatDateTime(trip.StartTime ?? trip.DepartureTime ?? trip.GoDate),
    PassengerNames: passengerNames,
    TicketStatusName: readString(ticket?.StatusName ?? ticket?.Status) || undefined,
    isShowPayButton: readPayButton(ticketVariables ?? variables),
  };
}

function resolveProductType(order: LegacyRecord): OrderDetailProductType | undefined {
  const type = readString(order.Type ?? order.ProductType);
  if (type === "Flight" || type === "Hotel" || type === "Train" || type === "Car") {
    return type;
  }
  if (asArray(order.OrderFlightTickets).length) return "Flight";
  if (asArray(order.OrderHotels).length) return "Hotel";
  if (asArray(order.OrderTrainTickets).length) return "Train";
  return undefined;
}

export function normalizeOrderDetailResponse(data: unknown): OrderDetailResponse {
  const root = asRecord(data);
  const order = asRecord(root?.Data) ?? root;
  if (!order) {
    return { OrderId: "" };
  }

  if (isNormalizedDetail(order)) {
    return order as unknown as OrderDetailResponse;
  }

  const productType = resolveProductType(order);
  const mapped =
    productType === "Flight"
      ? mapFlightDetail(order)
      : productType === "Hotel"
        ? mapHotelDetail(order)
        : productType === "Train"
          ? mapTrainDetail(order)
          : mapFlightDetail(order) ?? mapHotelDetail(order) ?? mapTrainDetail(order);

  if (mapped) {
    return mapped;
  }

  const variables = parseVariablesObj(order);
  return {
    OrderId: readString(order.Id ?? order.OrderId),
    OrderNumber: readString(order.Id ?? order.OrderNumber ?? order.OrderId),
    Status: readString(order.Status),
    StatusName: readString(order.StatusName ?? order.Status),
    TotalAmount: readNumber(order.TotalAmount),
    isShowPayButton: readPayButton(variables, order.isShowPayButton as boolean | undefined),
  };
}
