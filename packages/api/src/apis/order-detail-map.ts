import type {
  FlightOrderTicket,
  FlightOrderTrip,
  HotelOrderActionFlags,
  HotelOrderBillLine,
  HotelOrderDetail,
  HotelOrderHistory,
  HotelOrderRoom,
  HotelOrderRoomVariables,
  HotelOrderTraveler,
  OrderDetailProductType,
  OrderDetailResponse,
  TrainOrderTicket,
  TrainOrderTrip,
} from "@ryx/shared-types";
import {
  CREDENTIAL_TYPE_LABELS,
  inferCredentialTypeLabelFromMaskedNumber,
  maskCredentialNumber,
  parseTravelTimeMinutes,
} from "@ryx/shared-types";

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
import { formatCabinTypeName } from "./flight-detail-adapter.js";

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
    TicketStatusName:
      readString(ticket?.AppStatusName ?? ticket?.StatusName ?? ticket?.Status) || undefined,
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
    TicketStatusName:
      readString(ticket?.AppStatusName ?? ticket?.StatusName ?? ticket?.Status) || undefined,
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
  roomKey?: string,
): LegacyRecord | null {
  const hotelPassenger = asRecord(hotel.Passenger);
  const passengerId = readString(hotelPassenger?.Id);
  let matched: LegacyRecord | null = null;
  if (passengerId) {
    matched = orderPassengers.find((item) => readString(item.Id) === passengerId) ?? null;
  }
  if (!matched && roomKey) {
    matched = orderPassengers.find((item) => readString(item.Key) === roomKey) ?? null;
  }
  const resolved = matched ?? orderPassengers[0] ?? hotelPassenger;
  if (!resolved && !hotelPassenger) {
    return null;
  }
  return { ...hotelPassenger, ...resolved };
}

function resolvePassengerCredential(passenger: LegacyRecord): LegacyRecord | null {
  const credential = passenger.Credential;
  if (credential && typeof credential === "object" && !Array.isArray(credential)) {
    return asRecord(credential);
  }

  const credentials = passenger.Credentials;
  if (Array.isArray(credentials)) {
    const first = credentials.find(
      (item) => item && typeof item === "object" && !Array.isArray(item),
    );
    return first ? asRecord(first) : null;
  }
  if (credentials && typeof credentials === "object") {
    return asRecord(credentials);
  }

  return null;
}

const CREDENTIAL_TYPE_ENUM_LABELS: Record<string, string> = {
  IdCard: "身份证",
  Passport: "护照",
  HmPass: "港澳通行证",
  TwPass: "台湾通行证",
  Taiwan: "台胞证",
  HvPass: "回乡证",
  TaiwanEp: "入台证",
  Other: "其他",
  ResidencePermit: "港澳台居民居住证",
  AlienPermanentResidenceIdCard: "外国人永久居留身份证",
  MilitaryCard: "军人证",
};

function resolveCredentialTypeName(
  passenger: LegacyRecord,
  credential?: LegacyRecord,
  maskedNumber?: string,
): string | undefined {
  const typeName = readString(
    passenger.CredentialsTypeName ??
      passenger.CredentialTypeName ??
      passenger.TypeName ??
      credential?.CredentialsTypeName ??
      credential?.TypeName,
  );
  if (typeName && !/^\d+$/.test(typeName)) {
    return typeName;
  }

  const rawType =
    passenger.CredentialsType ??
    passenger.CredentialType ??
    credential?.CredentialsType ??
    credential?.Type;
  const typeCode = readNumber(rawType);
  if (typeCode != null && typeCode > 0 && CREDENTIAL_TYPE_LABELS[typeCode]) {
    return CREDENTIAL_TYPE_LABELS[typeCode];
  }

  const typeKey = readString(rawType);
  if (typeKey && CREDENTIAL_TYPE_ENUM_LABELS[typeKey]) {
    return CREDENTIAL_TYPE_ENUM_LABELS[typeKey];
  }

  return inferCredentialTypeLabelFromMaskedNumber(maskedNumber);
}

function resolveCredentialNumber(passenger: LegacyRecord): string | undefined {
  const credential = resolvePassengerCredential(passenger);
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

function formatRecordOutNumbers(value: unknown): string | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const lines = Object.entries(value as LegacyRecord)
    .map(([name, raw]) => {
      const number = readString(raw);
      if (!number) {
        return undefined;
      }
      return name ? `${name}:${number}` : number;
    })
    .filter((line): line is string => Boolean(line));

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
  const passenger = resolveOrderPassenger(hotel, orderPassengers, roomKey);
  if (!passenger) {
    return undefined;
  }

  const credential =
    resolvePassengerCredential(passenger) ??
    asRecord(hotelPassenger?.Credential) ??
    resolvePassengerCredential(hotelPassenger ?? {});
  const costCenterCode = joinTravelField(orderTravels, roomKey, "CostCenterCode");
  const costCenterName = joinTravelField(orderTravels, roomKey, "CostCenterName");
  const organizationCode = joinTravelField(orderTravels, roomKey, "OrganizationCode");
  const organizationName = joinTravelField(orderTravels, roomKey, "OrganizationName");
  const expenseType = joinTravelField(orderTravels, roomKey, "ExpenseType");
  const illegalPolicy = joinTravelField(orderTravels, roomKey, "IllegalPolicy");
  const illegalReason = joinTravelField(orderTravels, roomKey, "IllegalReason");
  const passengerKey = readString(passenger.Key);
  const credentialNumber =
    resolveCredentialNumber(passenger) ??
    (hotelPassenger ? resolveCredentialNumber(hotelPassenger) : undefined);

  return {
    Name: readString(passenger.Name ?? hotelPassenger?.Name) || undefined,
    CredentialType: resolveCredentialTypeName(passenger, credential ?? undefined, credentialNumber),
    CredentialNumber: credentialNumber,
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
    OutNumbers:
      resolveOutNumbers(orderNumbers, passengerKey) ||
      formatRecordOutNumbers(passenger.OutNumbers) ||
      formatRecordOutNumbers(credential?.OutNumbers),
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

function normalizePersonName(name?: string): string | undefined {
  if (!name) return undefined;
  const normalized = name.replace(/\//g, "").trim();
  return normalized || undefined;
}

function mapOrderContact(payload: LegacyRecord, order: LegacyRecord) {
  const linkmanRecords = [
    ...asArray<LegacyRecord>(payload.OrderLinkmans),
    ...asArray<LegacyRecord>(order.OrderLinkmans),
    ...asArray<LegacyRecord>(payload.Linkmans),
    ...asArray<LegacyRecord>(order.Linkmans),
  ];

  for (const record of linkmanRecords) {
    const contact = {
      Name: normalizePersonName(readString(record.Name)),
      Mobile: readString(record.Mobile ?? record.Phone) || undefined,
      Email: readString(record.Email) || undefined,
    };
    if (contact.Name || contact.Mobile || contact.Email) {
      return contact;
    }
  }

  const name = normalizePersonName(
    readString(
      order.ContactName ??
        order.BookContactName ??
        order.BookerName ??
        order.LinkmanName ??
        payload.ContactName,
    ),
  );
  const mobile =
    readString(
      order.ContactMobile ?? order.LinkmanMobile ?? order.MessageMobile ?? payload.ContactMobile,
    ) || undefined;
  const email =
    readString(order.ContactEmail ?? order.LinkmanEmail ?? payload.ContactEmail) || undefined;

  if (name || mobile || email) {
    return { Name: name, Mobile: mobile, Email: email };
  }

  return undefined;
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

const FLIGHT_PAY_TYPE_PERSON = 2;
const FLIGHT_PAY_TYPE_CREDIT = 4;

function resolveFlightCabinTypeLabel(
  ...sources: Array<LegacyRecord | undefined>
): string | undefined {
  for (const source of sources) {
    if (!source) continue;
    const name = readString(
      source.CabinTypeName ?? source.CabinTypeAttach ?? source.CabinName ?? source.SeatTypeName,
    );
    if (name && !/^\d+$/.test(name)) {
      return name;
    }
  }

  for (const source of sources) {
    if (!source) continue;
    const text = readString(source.CabinType ?? source.Cabin);
    if (text && !/^\d+$/.test(text)) {
      return text;
    }
    const code = readNumber(source.CabinType ?? source.Cabin);
    if (code != null) {
      const labeled = formatCabinTypeName(code);
      if (labeled) {
        return labeled;
      }
    }
  }

  return undefined;
}

function mapFlightTrip(trip: LegacyRecord): FlightOrderTrip {
  return {
    FromCityName: readString(trip.FromCityName) || undefined,
    ToCityName: readString(trip.ToCityName) || undefined,
    FromAirportName: readString(trip.FromAirportName) || undefined,
    ToAirportName: readString(trip.ToAirportName) || undefined,
    FromTerminal: readString(trip.FromTerminal) || undefined,
    ToTerminal: readString(trip.ToTerminal) || undefined,
    TakeoffTime: formatDateTime(trip.TakeoffTime ?? trip.DepartTime) || undefined,
    ArrivalTime: formatDateTime(trip.ArrivalTime) || undefined,
    FlightNumber: readString(trip.FlightNumber ?? trip.Number) || undefined,
    CodeShareNumber: readString(trip.CodeShareNumber) || undefined,
    PlaneType: readString(trip.PlaneType ?? trip.AirplaneType) || undefined,
    PlaneTypeDescribe:
      readString(trip.PlaneTypeDescribe ?? trip.AirplaneTypeDescribe ?? trip.PlaneDescribe) ||
      undefined,
    CabinType: resolveFlightCabinTypeLabel(trip),
    FlyTime: readString(trip.FlyTime ?? trip.Duration) || undefined,
    IsStop: Boolean(trip.IsStop),
    IsTransfer: Boolean(trip.IsTransfer),
    StopCities: readString(trip.StopCities) || undefined,
    Airline: readString(trip.Airline ?? trip.Carrier) || undefined,
    AirlineName: readString(trip.AirlineName) || undefined,
    AirlineSrc: readString(trip.AirlineSrc ?? trip.AirlineLogo) || undefined,
    CodeShareAirlineName:
      readString(trip.CodeShareAirlineName ?? trip.ShareAirlineName) || undefined,
  };
}

function enrichFlightTripFromTicket(trip: FlightOrderTrip, ticket: LegacyRecord): FlightOrderTrip {
  const ticketVariables = parseVariablesObj(ticket);
  return {
    ...trip,
    Airline: trip.Airline ?? (readString(ticket.Airline ?? ticket.Carrier) || undefined),
    AirlineName: trip.AirlineName ?? (readString(ticket.AirlineName) || undefined),
    AirlineSrc:
      trip.AirlineSrc ?? (readString(ticket.AirlineSrc ?? ticket.AirlineLogo) || undefined),
    CodeShareAirlineName:
      trip.CodeShareAirlineName ?? (readString(ticket.CodeShareAirlineName) || undefined),
    CodeShareNumber: trip.CodeShareNumber ?? (readString(ticket.CodeShareNumber) || undefined),
    PlaneType: trip.PlaneType ?? (readString(ticket.PlaneType ?? ticket.AirplaneType) || undefined),
    PlaneTypeDescribe:
      trip.PlaneTypeDescribe ??
      (readString(ticket.PlaneTypeDescribe ?? ticket.AirplaneTypeDescribe) || undefined),
    CabinType: trip.CabinType ?? resolveFlightCabinTypeLabel(ticket, ticketVariables),
    IsStop: trip.IsStop || Boolean(ticket.IsStop ?? ticketVariables?.IsStop),
    IsTransfer: trip.IsTransfer || Boolean(ticket.IsTransfer ?? ticketVariables?.IsTransfer),
    StopCities: trip.StopCities ?? (readString(ticket.StopCities) || undefined),
  };
}

function resolveFlightTravelPayTypeCode(
  payload: LegacyRecord,
  order: LegacyRecord,
  orderVariables?: LegacyRecord,
): number | undefined {
  const raw =
    orderVariables?.TravelPayType ??
    payload.TravelPayType ??
    order.TravelPayType ??
    parseVariablesObj(order)?.TravelPayType;
  const code = readNumber(raw);
  return code ?? undefined;
}

function ticketHasBookedSuccess(ticket: FlightOrderTicket): boolean {
  return Boolean(ticket.StatusName?.includes("预订成功"));
}

function sortFlightTicketsForTabs(tickets: FlightOrderTicket[]): FlightOrderTicket[] {
  const active = tickets.filter((ticket) => !ticket.IsOriginal);
  const original = tickets.filter((ticket) => ticket.IsOriginal);
  const byIdDesc = (a: FlightOrderTicket, b: FlightOrderTicket) =>
    Number(b.Id) - Number(a.Id) || b.Id.localeCompare(a.Id);
  return [...active.sort(byIdDesc), ...original.sort(byIdDesc)];
}

function mapFlightTicket(
  ticket: LegacyRecord,
  orderPassengers: LegacyRecord[],
  orderTravels: LegacyRecord[],
  orderNumbers: LegacyRecord[],
): FlightOrderTicket {
  const key = readString(ticket.Key ?? ticket.Id);
  const ticketVariables = parseVariablesObj(ticket);
  const passenger = asRecord(ticket.Passenger);
  const pseudoHotel = { Passenger: passenger };
  const traveler = mapTraveler(pseudoHotel, key, orderPassengers, orderTravels, orderNumbers);
  const trips = asArray<LegacyRecord>(ticket.OrderFlightTrips).map((trip) =>
    enrichFlightTripFromTicket(mapFlightTrip(trip), ticket),
  );
  const passengerRecord =
    orderPassengers.find((item) => readString(item.Id) === readString(passenger?.Id)) ?? passenger;

  return {
    Id: readString(ticket.Id),
    Key: key,
    Status: readString(ticket.Status) || undefined,
    StatusName: readString(ticket.StatusName ?? ticket.Status) || undefined,
    FullTicketNo: readString(ticket.FullTicketNo ?? ticket.TicketNo) || undefined,
    Explain: readString(ticket.Explain) || undefined,
    IsOriginal: Boolean(ticketVariables?.OriginalTicketId),
    Trips: trips,
    Traveler: traveler,
    PassengerTypeName:
      readString(passengerRecord?.PassengerTypeName ?? passenger?.PassengerTypeName) || undefined,
  };
}

function buildFlightActionFlags(
  tickets: FlightOrderTicket[],
  payHoldMinutes: number,
  travelPayTypeCode?: number,
): HotelOrderActionFlags {
  const hasBookedSuccess = tickets.some(ticketHasBookedSuccess);
  const hasHoldWindow = payHoldMinutes > 0;
  const isPersonalPay =
    travelPayTypeCode === FLIGHT_PAY_TYPE_PERSON || travelPayTypeCode === FLIGHT_PAY_TYPE_CREDIT;

  return {
    showPay: hasBookedSuccess && hasHoldWindow && isPersonalPay,
    showCancel: hasBookedSuccess && hasHoldWindow,
    smsAction: "none",
  };
}

function isNormalizedFlightDetail(data: LegacyRecord): boolean {
  if (typeof data.OrderId !== "string") {
    return false;
  }
  return Array.isArray(data.Tickets) && data.Tickets.length > 0;
}

function mapLegacyFlightDetail(payload: LegacyRecord): HotelOrderDetail {
  const order = asRecord(payload.Order) ?? payload;
  const orderVariables = parseVariablesObj(order);
  const rawTickets = asArray<LegacyRecord>(order.OrderFlightTickets);
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
  const rawBillItems = asArray<LegacyRecord>(order.OrderItems).map(mapBillItem);
  const tickets = sortFlightTicketsForTabs(
    rawTickets.map((ticket) =>
      mapFlightTicket(ticket, orderPassengers, orderTravels, orderNumbers),
    ),
  );
  const firstTicket = tickets[0];
  const firstTrip = firstTicket?.Trips[0];
  const payHoldMinutes = readNumber(orderVariables?.OrderPayHoldTime) ?? 0;
  const travelPayTypeCode = resolveFlightTravelPayTypeCode(payload, order, orderVariables);
  const actions = buildFlightActionFlags(tickets, payHoldMinutes, travelPayTypeCode);
  const statusName = mapStatusName(readString(order.StatusName ?? order.Status));
  const orderId = readString(order.Id ?? order.OrderId ?? payload.OrderId);
  const passengerNames =
    joinNames(tickets.map((ticket) => ticket.Traveler?.Name)) ||
    joinNames(orderPassengers.map((item) => readString(item.Name)));

  return {
    OrderId: orderId,
    OrderNumber: readString(order.Id ?? order.OrderNumber ?? orderId) || undefined,
    Status: readString(order.Status) || undefined,
    StatusName: statusName || undefined,
    TravelPayType: readString(payload.TravelPayType ?? order.TravelPayType) || undefined,
    TravelPayTypeCode: travelPayTypeCode,
    InsertTime:
      formatDateTime(order.InsertTime ?? order.InsertDateTime ?? order.CreateTime) || undefined,
    TotalAmount: readNumber(order.TotalAmount),
    SelfPayAmount: readNumber(orderVariables?.SelfPayAmount ?? variablesSelfPay(order)),
    isShowPayButton: actions.showPay,
    ProductType: "Flight",
    RouteTitle: firstTrip
      ? `${readString(firstTrip.FlightNumber)} ${readString(firstTrip.FromCityName)}—${readString(firstTrip.ToCityName)}`.trim()
      : undefined,
    DepartTime: firstTrip?.TakeoffTime,
    PassengerNames: passengerNames,
    TicketStatusName: firstTicket?.StatusName,
    Tickets: tickets,
    BillItems: rawBillItems,
    Histories: asArray<LegacyRecord>(payload.Histories).map(mapHistory),
    Actions: actions,
    PayHoldMinutes: payHoldMinutes > 0 ? payHoldMinutes : undefined,
    ShowServiceFee: true,
    TransactionId: firstTicket?.Id,
    Contact: mapOrderContact(payload, order),
  };
}

function formatMinutesAsRunTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours <= 0) return `${mins}分`;
  if (mins === 0) return `${hours}时`;
  return `${hours}时${mins}分`;
}

function mapTrainTripRunTime(trip: LegacyRecord): string | undefined {
  const direct = readString(trip.RunTime ?? trip.Duration ?? trip.FlyTime ?? trip.TravelTimeName);
  if (direct) return direct;

  const minutes = parseTravelTimeMinutes(trip.TravelMinutes ?? trip.TravelTime);
  return minutes ? formatMinutesAsRunTime(minutes) : undefined;
}

function mapTrainTrip(trip: LegacyRecord, ticket?: LegacyRecord): TrainOrderTrip {
  const ticketVariables = ticket ? parseVariablesObj(ticket) : undefined;
  return {
    TrainCode: readString(trip.TrainCode ?? trip.Number ?? ticket?.TrainCode) || undefined,
    FromStationName:
      readString(trip.FromStationName ?? trip.FromStation ?? ticket?.FromStationName) || undefined,
    ToStationName:
      readString(trip.ToStationName ?? trip.ToStation ?? ticket?.ToStationName) || undefined,
    StartTime:
      formatDateTime(trip.StartTime ?? trip.DepartureTime ?? trip.GoDate ?? trip.DepartTime) ||
      undefined,
    ArrivalTime: formatDateTime(trip.ArrivalTime ?? trip.EndTime) || undefined,
    RunTime: mapTrainTripRunTime(trip),
    CoachNo: readString(trip.CoachNo ?? trip.CarriageNo ?? ticketVariables?.CoachNo) || undefined,
    SeatNo: readString(trip.SeatNo ?? trip.SeatNumber ?? ticketVariables?.SeatNo) || undefined,
    SeatName: readString(trip.SeatName ?? ticketVariables?.SeatName ?? ticket?.Detail) || undefined,
    SeatTypeName:
      readString(trip.SeatTypeName ?? ticketVariables?.SeatTypeName ?? ticket?.SeatTypeName) ||
      undefined,
    Price: readNumber(trip.Price ?? trip.TicketPrice ?? ticket?.Price) ?? undefined,
    Explain: readString(trip.Explain ?? ticket?.Explain) || undefined,
  };
}

function mapTrainTicketActions(ticket: LegacyRecord) {
  const ticketVariables = parseVariablesObj(ticket);
  return {
    showRefund: Boolean(ticketVariables?.isShowRefundButton),
    showExchange: Boolean(ticketVariables?.isShowExchangeButton),
  };
}

function mapTrainTicket(
  ticket: LegacyRecord,
  orderPassengers: LegacyRecord[],
  orderTravels: LegacyRecord[],
  orderNumbers: LegacyRecord[],
): TrainOrderTicket {
  const key = readString(ticket.Key ?? ticket.Id);
  const ticketVariables = parseVariablesObj(ticket);
  const passenger = asRecord(ticket.Passenger);
  const enrichedPassenger = passenger ? { ...passenger, ...ticketVariables } : passenger;
  const pseudoHotel = { Passenger: enrichedPassenger };
  const traveler = mapTraveler(pseudoHotel, key, orderPassengers, orderTravels, orderNumbers);
  const trips = asArray<LegacyRecord>(ticket.OrderTrainTrips).map((trip) =>
    mapTrainTrip(trip, ticket),
  );
  const passengerRecord =
    orderPassengers.find((item) => readString(item.Id) === readString(passenger?.Id)) ?? passenger;

  return {
    Id: readString(ticket.Id),
    Key: key,
    Status: readString(ticket.Status) || undefined,
    StatusName: readString(ticket.StatusName ?? ticket.Status) || undefined,
    AppStatusName: readString(ticket.AppStatusName ?? ticketVariables?.AppStatusName) || undefined,
    FullTicketNo: readString(ticket.FullTicketNo ?? ticket.TicketNo) || undefined,
    Explain: readString(ticket.Explain) || undefined,
    SeatTypeName: readString(ticket.SeatTypeName) || undefined,
    Detail: readString(ticket.Detail) || undefined,
    SeatType: readNumber(ticket.SeatType),
    Trips: trips,
    Traveler: traveler,
    PassengerTypeName:
      readString(passengerRecord?.PassengerTypeName ?? passenger?.PassengerTypeName) || undefined,
    Actions: mapTrainTicketActions(ticket),
  };
}

function sortTrainTicketsForTabs(tickets: TrainOrderTicket[]): TrainOrderTicket[] {
  const byIdDesc = (a: TrainOrderTicket, b: TrainOrderTicket) =>
    Number(b.Id) - Number(a.Id) || b.Id.localeCompare(a.Id);
  return [...tickets].sort(byIdDesc);
}

function isTrainTicketPendingIssue(ticket: TrainOrderTicket): boolean {
  const label = (ticket.AppStatusName ?? ticket.StatusName ?? "").trim();
  return label.includes("待出票");
}

function isTrainOrderPendingIssue(order: LegacyRecord): boolean {
  const status = readString(order.Status);
  const statusName = readString(order.StatusName ?? order.Status);
  return status === "WaitIssue" || statusName.includes("待出票");
}

function resolveTrainIssueFlag(
  variables: LegacyRecord | undefined,
  tickets: TrainOrderTicket[] | undefined,
  order: LegacyRecord,
): boolean {
  if (variables?.isShowIssueButton === true || variables?.isShowIssueTrainButton === true) {
    return true;
  }
  const btnValue = readString(variables?.btnValue);
  if (readNumber(variables?.isBtn) === 1 && btnValue === "确认出票") {
    return true;
  }

  const pendingIssue =
    isTrainOrderPendingIssue(order) || Boolean(tickets?.some(isTrainTicketPendingIssue));
  if (!pendingIssue) {
    return false;
  }
  if (variables?.isShowIssueButton === false) {
    return false;
  }

  return btnValue === "确认出票" || variables?.isShowIssueButton !== false;
}

function buildTrainActionFlags(
  tickets: TrainOrderTicket[],
  order: LegacyRecord,
  orderVariables?: LegacyRecord,
  payHoldMinutes = 0,
  travelPayTypeCode?: number,
): HotelOrderActionFlags {
  const status = readString(order.Status);
  const hasHoldWindow = payHoldMinutes > 0;
  const isPersonalPay =
    travelPayTypeCode === FLIGHT_PAY_TYPE_PERSON || travelPayTypeCode === FLIGHT_PAY_TYPE_CREDIT;
  const showPay =
    Boolean(orderVariables?.isPay) && status !== "WaitHandle" && isPersonalPay && hasHoldWindow;
  const showIssue = resolveTrainIssueFlag(orderVariables, tickets, order);
  const showCancel =
    Boolean(orderVariables?.isShowCancelButton) || showPay || showIssue || hasHoldWindow;

  return {
    showPay,
    showCancel,
    showIssue,
    smsAction: "none",
  };
}

function isNormalizedTrainDetail(data: LegacyRecord): boolean {
  if (typeof data.OrderId !== "string" || data.ProductType !== "Train") {
    return false;
  }
  return Array.isArray(data.Tickets) && data.Tickets.length > 0;
}

function mapLegacyTrainDetail(payload: LegacyRecord): HotelOrderDetail {
  const order = asRecord(payload.Order) ?? payload;
  const orderVariables = parseVariablesObj(order);
  const rawTickets = asArray<LegacyRecord>(order.OrderTrainTickets);
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
  const rawBillItems = asArray<LegacyRecord>(order.OrderItems).map(mapBillItem);
  const tickets = sortTrainTicketsForTabs(
    rawTickets.map((ticket) => mapTrainTicket(ticket, orderPassengers, orderTravels, orderNumbers)),
  );
  const firstTicket = tickets[0];
  const firstTrip = firstTicket?.Trips[0];
  const payHoldMinutes =
    readNumber(orderVariables?.OrderPayHoldTime ?? orderVariables?.TrainHoldMinute) ?? 0;
  const travelPayTypeCode = resolveFlightTravelPayTypeCode(payload, order, orderVariables);
  const actions = buildTrainActionFlags(
    tickets,
    order,
    orderVariables,
    payHoldMinutes,
    travelPayTypeCode,
  );
  const statusName = mapStatusName(readString(order.StatusName ?? order.Status));
  const orderId = readString(order.Id ?? order.OrderId ?? payload.OrderId);
  const passengerNames =
    joinNames(tickets.map((ticket) => ticket.Traveler?.Name)) ||
    joinNames(orderPassengers.map((item) => readString(item.Name)));
  const tmc = asRecord(payload.Tmc);
  const showServiceFee = typeof tmc?.IsShowServiceFee === "boolean" ? tmc.IsShowServiceFee : true;

  return {
    OrderId: orderId,
    OrderNumber: readString(order.Id ?? order.OrderNumber ?? orderId) || undefined,
    Status: readString(order.Status) || undefined,
    StatusName: statusName || undefined,
    TravelPayType: readString(payload.TravelPayType ?? order.TravelPayType) || undefined,
    TravelPayTypeCode: travelPayTypeCode,
    InsertTime:
      formatDateTime(order.InsertTime ?? order.InsertDateTime ?? order.CreateTime) || undefined,
    TotalAmount: readNumber(order.TotalAmount),
    SelfPayAmount: readNumber(orderVariables?.SelfPayAmount ?? variablesSelfPay(order)),
    isShowPayButton: actions.showPay,
    ProductType: "Train",
    RouteTitle: firstTrip
      ? `${readString(firstTrip.TrainCode)} ${readString(firstTrip.FromStationName)}—${readString(firstTrip.ToStationName)}`.trim()
      : undefined,
    DepartTime: firstTrip?.StartTime,
    PassengerNames: passengerNames,
    TicketStatusName: firstTicket?.AppStatusName ?? firstTicket?.StatusName,
    Tickets: tickets,
    BillItems: rawBillItems,
    Histories: asArray<LegacyRecord>(payload.Histories).map(mapHistory),
    Actions: actions,
    PayHoldMinutes: payHoldMinutes > 0 ? payHoldMinutes : undefined,
    ShowServiceFee: showServiceFee,
    TransactionId: firstTicket?.Id,
    Contact: mapOrderContact(payload, order),
  };
}

export function shouldNormalizeTrainDetail(data: unknown, summary?: OrderDetailResponse): boolean {
  if (summary?.ProductType === "Train") {
    return true;
  }
  const payload = extractPayload(data);
  const order = asRecord(payload.Order) ?? payload;
  return asArray(order.OrderTrainTickets).length > 0;
}

/** Full train order detail for the train detail page. */
export function normalizeTrainOrderDetail(data: unknown): OrderDetailResponse {
  const payload = extractPayload(data);
  if (isNormalizedTrainDetail(payload)) {
    const detail = payload as unknown as HotelOrderDetail;
    const tickets = (detail.Tickets ?? []) as TrainOrderTicket[];
    const order = asRecord(payload.Order) ?? payload;
    const orderVariables = parseVariablesObj(order);
    return {
      ...detail,
      Tickets: tickets,
      BillItems: detail.BillItems ?? [],
      Histories: detail.Histories ?? [],
      Actions:
        detail.Actions ??
        buildTrainActionFlags(
          tickets,
          order,
          orderVariables,
          detail.PayHoldMinutes ?? 0,
          detail.TravelPayTypeCode,
        ),
      ShowServiceFee: detail.ShowServiceFee ?? true,
      ProductType: "Train",
    };
  }
  return mapLegacyTrainDetail(payload);
}

export function shouldNormalizeFlightDetail(data: unknown, summary?: OrderDetailResponse): boolean {
  if (summary?.ProductType === "Flight") {
    return true;
  }
  const payload = extractPayload(data);
  const order = asRecord(payload.Order) ?? payload;
  return asArray(order.OrderFlightTickets).length > 0;
}

/** Full flight order detail for the flight detail page. */
export function normalizeFlightOrderDetail(data: unknown): OrderDetailResponse {
  const payload = extractPayload(data);
  if (isNormalizedFlightDetail(payload)) {
    const detail = payload as unknown as HotelOrderDetail;
    return {
      ...detail,
      Tickets: detail.Tickets ?? [],
      BillItems: detail.BillItems ?? [],
      Histories: detail.Histories ?? [],
      Actions:
        detail.Actions ??
        buildFlightActionFlags(
          detail.Tickets ?? [],
          detail.PayHoldMinutes ?? 0,
          detail.TravelPayTypeCode,
        ),
      ShowServiceFee: detail.ShowServiceFee ?? true,
      ProductType: "Flight",
    };
  }
  return mapLegacyFlightDetail(payload);
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
