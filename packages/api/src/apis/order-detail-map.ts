import type {
  HotelOrderActionFlags,
  HotelOrderBillLine,
  HotelOrderDetail,
  HotelOrderHistory,
  HotelOrderRoom,
  HotelOrderRoomVariables,
  HotelOrderTraveler,
  OrderDetailProductType,
  OrderDetailResponse,
} from "@ryx/shared-types";
import { maskCredentialNumber } from "@ryx/shared-types";

import {
  asArray,
  asRecord,
  extractPayload,
  formatDateOnly,
  formatDateTime,
  parseVariablesObj,
  readNumber,
  readString,
  type LegacyRecord,
} from "./legacy-parse.js";

function joinNames(values: Array<string | undefined>): string {
  return values.filter((name): name is string => Boolean(name)).join("、");
}

function readPayButton(variables?: LegacyRecord, fallback?: boolean): boolean | undefined {
  if (variables?.isPay != null) {
    return Boolean(variables.isPay);
  }
  return fallback;
}

function isNormalizedOrderDetail(data: LegacyRecord): boolean {
  return typeof data.OrderId === "string" && typeof data.ProductType === "string";
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

function mapHotelSummaryDetail(order: LegacyRecord): OrderDetailResponse | null {
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

/** Lightweight detail for flight/train/hotel list cards and generic consumers. */
export function normalizeOrderDetailResponse(data: unknown): OrderDetailResponse {
  const root = asRecord(data);
  const envelope = asRecord(root?.Data) ?? root;
  if (!envelope) {
    return { OrderId: "" };
  }

  const payload = extractPayload(envelope);
  const order = asRecord(payload.Order) ?? payload;
  if (!order) {
    return { OrderId: "" };
  }

  if (isNormalizedOrderDetail(order)) {
    return order as unknown as OrderDetailResponse;
  }

  const productType = resolveProductType(order);
  const mapped =
    productType === "Flight"
      ? mapFlightDetail(order)
      : productType === "Hotel"
        ? mapHotelSummaryDetail(order)
        : productType === "Train"
          ? mapTrainDetail(order)
          : (mapFlightDetail(order) ?? mapHotelSummaryDetail(order) ?? mapTrainDetail(order));

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

function mapStatusName(statusName: string): string {
  return statusName === "等待处理" ? "等待审批" : statusName;
}

function mapPaymentType(value: unknown): string | number | undefined {
  if (value == null || value === "") {
    return undefined;
  }
  return typeof value === "number" ? value : readString(value);
}

function mapRoomVariables(record: LegacyRecord): HotelOrderRoomVariables | undefined {
  const vars = parseVariablesObj(record);
  if (!vars) {
    return undefined;
  }
  return {
    isBtn: readNumber(vars.isBtn),
    btnValue: readString(vars.btnValue) || undefined,
    SMSCodeVerifyResultDesc: readString(vars.SMSCodeVerifyResultDesc) || undefined,
    VerifySmsCodeMobile: readString(vars.VerifySmsCodeMobile) || undefined,
    SupplierName: readString(vars.SupplierName) || undefined,
    ExceptionMessage: readString(vars.ExceptionMessage) || undefined,
  };
}

function formatCodeName(code: string, name: string): string | undefined {
  if (code && name) {
    return `${code}-${name}`;
  }
  return name || code || undefined;
}

function joinTravelField(travels: LegacyRecord[], roomKey: string, field: string): string {
  return travels
    .filter((travel) => readString(travel.Key) === roomKey)
    .map((travel) => readString(travel[field]))
    .filter(Boolean)
    .join(",");
}

function resolveOrderPassenger(
  hotel: LegacyRecord,
  orderPassengers: LegacyRecord[],
): LegacyRecord | null {
  const hotelPassenger = asRecord(hotel.Passenger);
  const passengerId = readString(hotelPassenger?.Id);
  if (passengerId) {
    const matched = orderPassengers.find((item) => readString(item.Id) === passengerId);
    if (matched) {
      return matched;
    }
  }
  return orderPassengers[0] ?? hotelPassenger;
}

function resolveCredentialNumber(passenger: LegacyRecord): string | undefined {
  const credential = asRecord(passenger.Credential) ?? asRecord(passenger.Credentials);
  const hideNumber = readString(
    passenger.HideCredentialsNumber ?? passenger.HideNumber ?? credential?.HideNumber,
  );
  if (hideNumber) {
    return hideNumber;
  }

  const rawNumber = readString(
    passenger.CredentialsNumber ??
      passenger.CredentialNumber ??
      credential?.Number ??
      credential?.IdNumber,
  );
  return rawNumber ? maskCredentialNumber(rawNumber) : undefined;
}

function resolveOutNumbers(orderNumbers: LegacyRecord[], passengerKey: string): string | undefined {
  const lines = orderNumbers
    .filter((item) => {
      const tag = readString(item.Tag);
      if (tag !== "TmcOutNumber" && tag !== "OutNumber") {
        return false;
      }
      const itemKey = readString(item.Key);
      return !passengerKey || !itemKey || itemKey === passengerKey;
    })
    .map((item) => {
      const name = readString(item.Name);
      const number = readString(item.Number ?? item.Value);
      if (name && number) {
        return `${name}:${number}`;
      }
      return number || name;
    })
    .filter(Boolean);

  return lines.length > 0 ? lines.join("、") : undefined;
}

function mapTraveler(
  hotel: LegacyRecord,
  roomKey: string,
  orderPassengers: LegacyRecord[],
  orderTravels: LegacyRecord[],
  orderNumbers: LegacyRecord[],
): HotelOrderTraveler | undefined {
  const hotelPassenger = asRecord(hotel.Passenger);
  const passenger = resolveOrderPassenger(hotel, orderPassengers);
  if (!passenger) {
    return undefined;
  }

  const credential =
    asRecord(passenger.Credential) ??
    asRecord(passenger.Credentials) ??
    asRecord(hotelPassenger?.Credential) ??
    asRecord(hotelPassenger?.Credentials);
  const costCenterCode = joinTravelField(orderTravels, roomKey, "CostCenterCode");
  const costCenterName = joinTravelField(orderTravels, roomKey, "CostCenterName");
  const organizationCode = joinTravelField(orderTravels, roomKey, "OrganizationCode");
  const organizationName = joinTravelField(orderTravels, roomKey, "OrganizationName");
  const expenseType = joinTravelField(orderTravels, roomKey, "ExpenseType");
  const illegalPolicy = joinTravelField(orderTravels, roomKey, "IllegalPolicy");
  const illegalReason = joinTravelField(orderTravels, roomKey, "IllegalReason");
  const passengerKey = readString(passenger.Key);

  return {
    Name: readString(passenger.Name ?? hotelPassenger?.Name) || undefined,
    CredentialType:
      readString(
        passenger.CredentialsTypeName ??
          passenger.CredentialTypeName ??
          credential?.TypeName ??
          credential?.Type ??
          passenger.CredentialType ??
          hotelPassenger?.CredentialType,
      ) || undefined,
    CredentialNumber:
      resolveCredentialNumber(passenger) ??
      (hotelPassenger ? resolveCredentialNumber(hotelPassenger) : undefined),
    Mobile:
      readString(
        passenger.Mobile ?? passenger.Phone ?? hotelPassenger?.Mobile ?? hotelPassenger?.Phone,
      ) || undefined,
    Email: readString(passenger.Email ?? hotelPassenger?.Email) || undefined,
    ExpenseType:
      expenseType || readString(passenger.ExpenseTypeName ?? passenger.ExpenseType) || undefined,
    CostCenterName:
      formatCodeName(costCenterCode, costCenterName) ||
      readString(passenger.CostCenterName ?? passenger.CostCenter) ||
      undefined,
    OrganizationName:
      formatCodeName(organizationCode, organizationName) ||
      readString(passenger.OrganizationName ?? passenger.Organization ?? passenger.OrgName) ||
      undefined,
    PolicyName: illegalPolicy || readString(passenger.PolicyName) || undefined,
    IllegalReason: illegalReason || readString(passenger.IllegalReason) || undefined,
    OutNumbers: resolveOutNumbers(orderNumbers, passengerKey),
  };
}

function mapBillItem(item: LegacyRecord): HotelOrderBillLine {
  return {
    Name: readString(item.Name) || "费用",
    Amount: readNumber(item.Amount) ?? 0,
    Tag: readString(item.Tag) || undefined,
    Key: readString(item.Key) || undefined,
  };
}

function computeRoomFee(items: HotelOrderBillLine[], roomKey: string): number | undefined {
  const hotelItems = items.filter((item) => item.Key === roomKey && item.Tag === "Hotel");
  if (hotelItems.length === 0) {
    return undefined;
  }
  return hotelItems.reduce((sum, item) => sum + item.Amount, 0);
}

function mapRoom(
  hotel: LegacyRecord,
  billItems: HotelOrderBillLine[],
  orderPassengers: LegacyRecord[],
  orderTravels: LegacyRecord[],
  orderNumbers: LegacyRecord[],
): HotelOrderRoom {
  const key = readString(hotel.Key ?? hotel.Id);
  const vars = mapRoomVariables(hotel);
  const customerName = readString(hotel.CustomerName);
  const otherGuests = customerName.includes("|")
    ? customerName.split("|").slice(1).join("|").trim()
    : "";

  const traveler = mapTraveler(hotel, key, orderPassengers, orderTravels, orderNumbers);
  if (traveler && otherGuests) {
    traveler.OtherGuestNames = otherGuests;
  }

  return {
    Id: readString(hotel.Id),
    Key: key,
    HotelName: readString(hotel.HotelName ?? hotel.Name) || undefined,
    RoomName: readString(hotel.RoomName ?? hotel.RoomType) || undefined,
    Breakfast: readNumber(hotel.Breakfast) ?? (readString(hotel.Breakfast) || undefined),
    Status: readString(hotel.Status) || undefined,
    StatusName: readString(hotel.StatusName ?? hotel.Status) || undefined,
    BeginDate: formatDateOnly(hotel.BeginDate ?? hotel.CheckInDate) || undefined,
    EndDate: formatDateOnly(hotel.EndDate ?? hotel.CheckOutDate) || undefined,
    CheckinTime: formatDateTime(hotel.CheckinTime ?? hotel.ActualCheckinTime) || undefined,
    CheckoutTime: formatDateTime(hotel.CheckoutTime ?? hotel.ActualCheckoutTime) || undefined,
    HotelAddress: readString(hotel.HotelAddress ?? hotel.Address) || undefined,
    PaymentType: mapPaymentType(hotel.PaymentType),
    RoomFee: computeRoomFee(billItems, key),
    HotelInvoice: readString(hotel.HotelInvoice) || undefined,
    HotelContact: readString(hotel.HotelContact ?? hotel.Contact) || undefined,
    SupplierName:
      vars?.SupplierName ?? (readString(hotel.SupplierName ?? hotel.Supplier) || undefined),
    RuleDescription: readString(hotel.RuleDescription) || undefined,
    ExceptionMessage: vars?.ExceptionMessage,
    CustomerName: customerName || undefined,
    Variables: vars,
    Traveler: traveler,
  };
}

function mapHistory(item: LegacyRecord): HotelOrderHistory {
  const account = asRecord(item.Account);
  const vars = parseVariablesObj(item);
  return {
    TypeName: readString(vars?.TypeName ?? item.TypeName) || undefined,
    ApproverName: readString(account?.RealName ?? account?.Name ?? item.ApproverName) || undefined,
    StatusName: readString(item.StatusName ?? item.Status) || undefined,
    InsertTime: formatDateTime(item.InsertTime ?? item.InsertDateTime) || undefined,
    ExpiredTime: formatDateTime(item.ExpiredTime) || undefined,
  };
}

function resolveSmsAction(
  firstRoomVars?: HotelOrderRoomVariables,
): Pick<HotelOrderActionFlags, "smsAction" | "smsReadOnlyText" | "smsError" | "smsMobile"> {
  const smsError = firstRoomVars?.SMSCodeVerifyResultDesc;
  const isBtn = firstRoomVars?.isBtn;
  const btnValue = firstRoomVars?.btnValue ?? "";

  if (isBtn === 1 && btnValue === "获取短信验证码") {
    return {
      smsAction: "sendCode",
      smsMobile: firstRoomVars?.VerifySmsCodeMobile,
      smsError,
      smsReadOnlyText: undefined,
    };
  }
  if (isBtn === 1 && btnValue === "短信验证码校验") {
    return {
      smsAction: "confirmCode",
      smsMobile: firstRoomVars?.VerifySmsCodeMobile,
      smsError,
      smsReadOnlyText: undefined,
    };
  }
  if (isBtn === 0 && btnValue) {
    return {
      smsAction: "readOnly",
      smsReadOnlyText: btnValue,
      smsError,
      smsMobile: undefined,
    };
  }
  return {
    smsAction: "none",
    smsError,
    smsReadOnlyText: undefined,
    smsMobile: undefined,
  };
}

function buildActionFlags(order: LegacyRecord, firstRoom?: HotelOrderRoom): HotelOrderActionFlags {
  const variables = parseVariablesObj(order);
  const status = readString(order.Status);
  const showPay = Boolean(variables?.isPay) && status !== "WaitHandle";
  const firstRoomVars = firstRoom?.Variables;
  const sms = resolveSmsAction(firstRoomVars);

  return {
    showPay,
    showCancel: Boolean(variables?.isShowCancelButton),
    cancelOrderHotelId: firstRoom?.Id,
    ...sms,
  };
}

function isNormalizedHotelDetail(data: LegacyRecord): boolean {
  if (typeof data.OrderId !== "string" || !Array.isArray(data.Rooms)) {
    return false;
  }
  return data.Rooms.length > 0 || Boolean(data.Actions);
}

function enrichMinimalDetail(detail: HotelOrderDetail): HotelOrderDetail {
  if ((detail.Rooms?.length ?? 0) > 0) {
    return detail;
  }
  if (!detail.HotelName && !detail.CheckInDate) {
    return detail;
  }

  const room: HotelOrderRoom = {
    Id: detail.TransactionId ?? detail.OrderId,
    Key: detail.OrderId,
    HotelName: detail.HotelName,
    BeginDate: detail.CheckInDate,
    EndDate: detail.CheckOutDate,
    StatusName: detail.StatusName,
  };

  return {
    ...detail,
    Rooms: [room],
    TransactionId: room.Id,
  };
}

function mapLegacyHotelDetail(payload: LegacyRecord): HotelOrderDetail {
  const order = asRecord(payload.Order) ?? payload;
  const orderVariables = parseVariablesObj(order);
  const tmc = asRecord(payload.Tmc) ?? asRecord(order.Tmc);
  const showServiceFee = tmc?.IsShowServiceFee !== false;

  const rawBillItems = asArray<LegacyRecord>(order.OrderItems).map(mapBillItem);
  const rawHotels = asArray<LegacyRecord>(order.OrderHotels);
  const orderPassengers = [
    ...asArray<LegacyRecord>(payload.OrderPassengers),
    ...asArray<LegacyRecord>(order.OrderPassengers),
  ];
  const orderTravels = [
    ...asArray<LegacyRecord>(payload.OrderTravels),
    ...asArray<LegacyRecord>(order.OrderTravels),
  ];
  const orderNumbers = [
    ...asArray<LegacyRecord>(payload.OrderNumbers),
    ...asArray<LegacyRecord>(order.OrderNumbers),
  ];

  const rooms = rawHotels.map((hotel) =>
    mapRoom(hotel, rawBillItems, orderPassengers, orderTravels, orderNumbers),
  );
  const firstRoom = rooms[0];
  const actions = buildActionFlags(order, firstRoom);

  const statusName = mapStatusName(readString(order.StatusName ?? order.Status));
  const orderId = readString(order.Id ?? order.OrderId ?? payload.OrderId);

  return {
    OrderId: orderId,
    OrderNumber: readString(order.Id ?? order.OrderNumber ?? orderId) || undefined,
    Status: readString(order.Status) || undefined,
    StatusName: statusName || undefined,
    TravelPayType: readString(payload.TravelPayType ?? order.TravelPayType) || undefined,
    InsertTime:
      formatDateTime(order.InsertTime ?? order.InsertDateTime ?? order.CreateTime) || undefined,
    TotalAmount: readNumber(order.TotalAmount),
    SelfPayAmount: readNumber(orderVariables?.SelfPayAmount ?? variablesSelfPay(order)),
    isShowPayButton: actions.showPay,
    HotelName: firstRoom?.HotelName,
    CheckInDate: firstRoom?.BeginDate,
    CheckOutDate: firstRoom?.EndDate,
    Rooms: rooms,
    BillItems: rawBillItems,
    Histories: asArray<LegacyRecord>(payload.Histories).map(mapHistory),
    Actions: actions,
    ShowServiceFee: showServiceFee,
    TransactionId: firstRoom?.Id,
  };
}

function variablesSelfPay(order: LegacyRecord): number | undefined {
  return readNumber(parseVariablesObj(order)?.SelfPayAmount);
}

export function shouldNormalizeHotelDetail(data: unknown, summary?: OrderDetailResponse): boolean {
  if (summary?.ProductType === "Hotel") {
    return true;
  }
  const payload = extractPayload(data);
  const order = asRecord(payload.Order) ?? payload;
  return asArray(order.OrderHotels).length > 0;
}

/** Full hotel order detail for the hotel detail page. */
export function normalizeHotelOrderDetail(data: unknown): OrderDetailResponse {
  const payload = extractPayload(data);
  if (isNormalizedHotelDetail(payload)) {
    const detail = payload as unknown as HotelOrderDetail;
    return enrichMinimalDetail({
      ...detail,
      Rooms: detail.Rooms ?? [],
      BillItems: detail.BillItems ?? [],
      Histories: detail.Histories ?? [],
      Actions: detail.Actions ?? {
        showPay: Boolean(detail.isShowPayButton),
        showCancel: false,
        smsAction: "none",
      },
      ShowServiceFee: detail.ShowServiceFee ?? true,
    });
  }
  return mapLegacyHotelDetail(payload);
}
