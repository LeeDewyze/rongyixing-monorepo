import type {
  FlightAuthorizedContact,
  FlightInitBookResponse,
  FlightInitStaff,
  FlightOutNumberField,
  FlightPassengerBookForm,
  FlightPassengerContactOption,
  HotelBookLinkmanDto,
  HotelBookPassengerDto,
  HotelBookResponse,
  HotelBookRoomPlanDto,
  HotelInitBookResponse,
  HotelInitStaff,
  HotelOrderBookDto,
  HotelRoom,
  HotelRoomPlan,
  PassengerBookInfo,
} from "@ryx/shared-types";
import { credentialDisplayNumber, credentialTypeValue } from "@ryx/shared-types";

import { addDays } from "@/lib/date-search";
import { buildAuthorizedLinkmans, validateAuthorizedContacts } from "@/lib/flight-book-contacts";
import { resolvePassengerTravelPolicy } from "@/lib/flight-book-cabin";
import {
  resolvePassengerFormEmail,
  resolvePassengerFormMobile,
  splitContactOptions,
} from "@/lib/flight-book-passenger-form";
import {
  buildPassengerOutNumberFields,
  mergeOutNumberValues,
  validatePassengerOutNumbers,
} from "@/lib/flight-book-outnumber";
import { resolveFlightTravelType } from "@/lib/flight-travel-mode";
import type { HotelBookSelection } from "@/lib/hotel-book-session";

/** Legacy `getChannel()` for H5 book submit. */
export const HOTEL_BOOK_CHANNEL = "客户H5";

/** Legacy OrderHotelType.Domestic */
export const HOTEL_ORDER_HOTEL_TYPE_DOMESTIC = 1;

/** Legacy HotelPaymentType */
export const HOTEL_PAYMENT_PREPAY = 1;
export const HOTEL_PAYMENT_SELF_PAY = 2;
export const HOTEL_PAYMENT_SETTLE = 4;

export type HotelNotifyLanguage = "" | "cn" | "en";

export interface HotelPassengerBookForm {
  passengerId: string;
  expanded: boolean;
  arrivalTime: string;
  notifyLanguage: HotelNotifyLanguage;
  illegalReason: string;
  otherIllegalReason: string;
  expenseTypeId: string;
  roommate: string;
  mobileOptions: FlightPassengerContactOption[];
  emailOptions: FlightPassengerContactOption[];
  otherMobile: string;
  otherEmail: string;
  organization: { code: string; name: string };
  otherOrganizationName: string;
  costCenter: { code: string; name: string };
  otherCostCenterName: string;
  otherCostCenterCode: string;
  approvalId: string;
  approvalName: string;
  isSkipApprove: boolean;
  outNumbers: Record<string, string>;
}

export interface HotelCreditCardForm {
  cardNumber: string;
  holderName: string;
  expireDate: string;
  cvv: string;
}

export function resolveHotelInitClientId(info: PassengerBookInfo): string {
  const accountId =
    ("AccountId" in info.passenger ? info.passenger.AccountId : undefined) ??
    info.credential.AccountId;
  return String(accountId ?? info.credential.Id ?? info.id);
}

function toLegacyPolicyDate(value?: string): string | undefined {
  if (!value?.trim()) return undefined;
  const trimmed = value.trim();
  if (trimmed.includes("T")) return trimmed;
  return `${trimmed}T00:00:00`;
}

function toLegacyRoomId(roomId: string): number | string {
  const numeric = Number(roomId);
  if (Number.isFinite(numeric) && String(numeric) === roomId) return numeric;
  const parsed = Number.parseInt(roomId, 10);
  return Number.isFinite(parsed) ? parsed : roomId;
}

function normalizeLegacyRoomPlanPrices(
  prices: HotelBookRoomPlanDto["RoomPlanPrices"],
): HotelBookRoomPlanDto["RoomPlanPrices"] {
  if (!prices?.length) return prices;
  return prices.map((item) => ({
    ...item,
    Date: item.Date ? toLegacyPolicyDate(item.Date.slice(0, 10)) : item.Date,
  }));
}

function attachHotelToRoomPlan(
  dto: HotelBookRoomPlanDto,
  room: HotelRoom,
  hotel?: Pick<
    HotelBookSelection,
    "hotelId" | "hotelName" | "cityCode" | "hotelAddress" | "hotelPhone"
  >,
): HotelBookRoomPlanDto {
  const roomId = toLegacyRoomId(room.RoomId);
  const existingRoom = dto.Room ?? {};
  dto.Room = {
    ...existingRoom,
    Id: existingRoom.Id ?? roomId,
    Name: room.RoomName ?? existingRoom.Name,
    ...(hotel
      ? {
          Hotel: {
            Id: hotel.hotelId,
            Name: hotel.hotelName,
            Address: hotel.hotelAddress,
            Phone: hotel.hotelPhone,
            CityCode: hotel.cityCode,
          },
        }
      : {}),
  };
  return dto;
}

function buildHotelInitRoomPlanFromLegacyWire(
  plan: HotelRoomPlan,
  room: HotelRoom,
  hotel?: Pick<
    HotelBookSelection,
    "hotelId" | "hotelName" | "cityCode" | "hotelAddress" | "hotelPhone"
  >,
): HotelBookRoomPlanDto {
  const dto = JSON.parse(JSON.stringify(plan.LegacyWire)) as HotelBookRoomPlanDto;
  if (dto.BeginDate) dto.BeginDate = toLegacyPolicyDate(String(dto.BeginDate).slice(0, 10));
  if (dto.EndDate) dto.EndDate = toLegacyPolicyDate(String(dto.EndDate).slice(0, 10));
  if (!dto.Variables && plan.VariablesObj && Object.keys(plan.VariablesObj).length > 0) {
    dto.Variables = JSON.stringify(plan.VariablesObj);
  }
  dto.RoomPlanPrices = normalizeLegacyRoomPlanPrices(dto.RoomPlanPrices ?? plan.RoomPlanPrices);
  if (!dto.RoomPlanRules?.length && plan.RoomPlanRules?.length) {
    dto.RoomPlanRules = plan.RoomPlanRules;
  }
  if (dto.Id == null || String(dto.Id) === "0") {
    dto.Id = "0";
  }
  if (dto.PaymentType === HOTEL_PAYMENT_PREPAY) {
    dto.IsPrepay = true;
  }
  return attachHotelToRoomPlan(dto, room, hotel);
}

export function buildHotelInitRoomPlan(
  plan: HotelRoomPlan,
  room: HotelRoom,
  hotel?: Pick<
    HotelBookSelection,
    "hotelId" | "hotelName" | "cityCode" | "hotelAddress" | "hotelPhone"
  >,
): HotelBookRoomPlanDto {
  if (plan.LegacyWire && Object.keys(plan.LegacyWire).length > 0) {
    return buildHotelInitRoomPlanFromLegacyWire(plan, room, hotel);
  }

  const legacyId = plan.LegacyId ?? plan.PlanId;
  const dto: HotelBookRoomPlanDto = {
    Name: plan.PlanName,
    TotalAmount: plan.TotalAmount ?? plan.Price,
    Number: plan.Number ?? "",
    SupplierNumber: plan.SupplierNumber != null ? String(plan.SupplierNumber) : "",
    SupplierType: plan.SupplierType,
    BeginDate: toLegacyPolicyDate(plan.BeginDate),
    EndDate: toLegacyPolicyDate(plan.EndDate),
    PaymentType: plan.PaymentType,
    RoomPlanPrices: normalizeLegacyRoomPlanPrices(plan.RoomPlanPrices),
    Key: plan.Key,
    BookCode: plan.BookCode,
    BookType: plan.BookType,
    Room: {
      Id: toLegacyRoomId(room.RoomId),
      Name: room.RoomName,
      ...(hotel
        ? {
            Hotel: {
              Id: hotel.hotelId,
              Name: hotel.hotelName,
              Address: hotel.hotelAddress,
              Phone: hotel.hotelPhone,
              CityCode: hotel.cityCode,
            },
          }
        : {}),
    },
  };

  if (legacyId && legacyId !== "0") {
    dto.Id = legacyId;
  } else {
    dto.Id = "0";
  }

  if (plan.VariablesObj && Object.keys(plan.VariablesObj).length > 0) {
    dto.Variables = JSON.stringify(plan.VariablesObj);
  }

  if (plan.RoomPlanRules?.length) {
    dto.RoomPlanRules = plan.RoomPlanRules;
  } else if (plan.CancelPolicy) {
    dto.RoomPlanRules = [{ Description: plan.CancelPolicy }];
  }

  if (plan.PaymentType === HOTEL_PAYMENT_PREPAY) {
    dto.IsPrepay = true;
  }

  return dto;
}

/** Legacy `fillBookPassengers` — spread credential with Policy / CredentialsInfo. */
function buildSubmitCredentials(
  info: PassengerBookInfo,
  accountId: string,
): HotelBookPassengerDto["Credentials"] {
  const cred = info.credential;
  const passengerPolicy = resolvePassengerTravelPolicy(info);
  const hideNumber = cred.HideNumber ?? cred.HideCredentialsNumber ?? credentialDisplayNumber(cred);
  const credType = credentialTypeValue(cred);

  return {
    ...cred,
    Type: credType,
    CredentialsType: credType,
    AccountId: accountId,
    Account: accountId ? { Id: accountId } : cred.Account,
    ...(passengerPolicy ? { Policy: passengerPolicy } : {}),
    ...(cred.Name && hideNumber ? { CredentialsInfo: `${cred.Name}|${hideNumber}` } : {}),
    HideNumber: hideNumber,
    checked: true,
  };
}

export function buildHotelInitBookDto(input: {
  selection: HotelBookSelection;
  passengers: PassengerBookInfo[];
  travelFormId?: string;
  agentId?: string;
}): HotelOrderBookDto {
  const { selection, passengers, travelFormId, agentId } = input;
  const roomPlan = buildHotelInitRoomPlan(selection.plan, selection.room, selection);

  const passengerDtos: HotelBookPassengerDto[] = passengers.map((info) => {
    const clientId = resolveHotelInitClientId(info);
    const accountId = clientId;
    const passengerTravelFormId =
      travelFormId ?? ("travelFormId" in info.passenger ? info.passenger.travelFormId : undefined);

    return {
      ClientId: clientId,
      RoomPlan: roomPlan,
      Credentials: buildSubmitCredentials(info, accountId),
      Mobile: info.credential.Mobile,
      travelFormId: passengerTravelFormId,
      travelNumber: "travelNumber" in info.passenger ? info.passenger.travelNumber : undefined,
      OrderHotelType: HOTEL_ORDER_HOTEL_TYPE_DOMESTIC,
    };
  });

  const dto: HotelOrderBookDto = {
    TravelFormId: travelFormId ?? "",
    Passengers: passengerDtos,
  };

  if (agentId) {
    dto.AgentId = agentId;
  }

  return dto;
}

export function buildHotelOrderBookDto(input: {
  selection: HotelBookSelection;
  passengers: PassengerBookInfo[];
  forms: Record<string, HotelPassengerBookForm>;
  travelFormId?: string;
  travelPayType?: number;
  travelType?: number;
  authorizedContactsByPassenger?: Record<string, FlightAuthorizedContact[]>;
  agentId?: string;
  globalArrivalTime?: string;
  globalNotifyLanguage?: HotelNotifyLanguage;
  creditCard?: HotelCreditCardForm;
  outNumberFieldsByPassenger?: Record<string, FlightOutNumberField[]>;
  isFromOffline?: boolean;
  /** Last Initialize payload — Book must reuse the same RoomPlan wire shape. */
  initDto?: HotelOrderBookDto;
}): HotelOrderBookDto {
  const base: HotelOrderBookDto = input.initDto
    ? (JSON.parse(JSON.stringify(input.initDto)) as HotelOrderBookDto)
    : buildHotelInitBookDto({
        selection: input.selection,
        passengers: input.passengers,
        travelFormId: input.travelFormId,
        agentId: input.agentId,
      });

  if (input.agentId) {
    base.AgentId = input.agentId;
  }

  const travelPayType = input.travelPayType;
  const travelType = input.travelType ?? resolveFlightTravelType();
  const rootLinkmans: HotelBookLinkmanDto[] = [];

  base.Passengers = base.Passengers.map((dto, index) => {
    const passenger = input.passengers[index];
    if (!passenger) return dto;
    const form = input.forms[passenger.id];
    if (!form) return dto;

    const customerName = form.roommate.trim()
      ? `${passenger.credential.Name}|${form.roommate.trim()}`
      : (passenger.credential.Name ?? "");

    const outNumberFields = input.outNumberFieldsByPassenger?.[passenger.id] ?? [];
    const outNumbers = mergeOutNumberValues(
      { outNumbers: form.outNumbers } as FlightPassengerBookForm,
      outNumberFields,
    );

    const contactForm = form as FlightPassengerBookForm;
    const mobile = resolvePassengerFormMobile(contactForm);
    const email = resolvePassengerFormEmail(contactForm);

    const initPassenger = input.initDto?.Passengers[index];
    const roomPlan = initPassenger?.RoomPlan ?? dto.RoomPlan;
    const baseCredentials = initPassenger?.Credentials ?? dto.Credentials;

    const passengerDto: HotelBookPassengerDto = {
      ...dto,
      RoomPlan: roomPlan,
      CardName: "",
      CardNumber: "",
      TicketNum: "",
      Credentials: {
        ...baseCredentials,
        Name: customerName,
        Mobile: mobile || baseCredentials.Mobile,
        ...(email ? { Email: email } : {}),
      },
      CustomerName: customerName,
      Mobile: mobile || dto.Mobile,
      Email: email || "",
      CheckinTime: input.globalArrivalTime ?? form.arrivalTime,
      MessageLang: input.globalNotifyLanguage ?? form.notifyLanguage,
      TravelPayType: travelPayType,
      TravelType: travelType,
      IllegalReason: form.otherIllegalReason || form.illegalReason,
      IllegalPolicy: "",
      ExpenseType: form.expenseTypeId || undefined,
      ApprovalId: form.isSkipApprove ? "0" : form.approvalId || "0",
      IsSkipApprove: form.isSkipApprove,
      CostCenterCode: form.otherCostCenterCode || form.costCenter.code || "",
      CostCenterName: form.otherCostCenterName || form.costCenter.name || "",
      OrganizationName: form.otherOrganizationName || form.organization.name || "",
      OrganizationCode: form.otherOrganizationName ? "" : form.organization.code || "",
      OutNumbers: Object.keys(outNumbers).length ? outNumbers : null,
    };

    const roomContacts = input.authorizedContactsByPassenger?.[passenger.id] ?? [];
    const linkmans = buildAuthorizedLinkmans(roomContacts);
    if (linkmans.length) {
      rootLinkmans.push(...linkmans);
    }

    if (index === 0 && input.creditCard) {
      const card = input.creditCard;
      if (card.cardNumber.trim() || card.holderName.trim()) {
        passengerDto.OrderCard = {
          CardNumber: card.cardNumber.trim(),
          HolderName: card.holderName.trim(),
          ExpireDate: card.expireDate.trim(),
          Cvv: card.cvv.trim(),
        };
      }
    }

    const passengerPolicy = resolvePassengerTravelPolicy(passenger);
    if (passengerPolicy) {
      passengerDto.Policy = passengerPolicy;
    }

    return passengerDto;
  });

  if (travelPayType != null) {
    base.TravelPayType = travelPayType;
  }
  base.Channel = HOTEL_BOOK_CHANNEL;
  base.IsFromOffline = input.isFromOffline ?? false;
  if (rootLinkmans.length) {
    base.Linkmans = rootLinkmans;
  }

  return base;
}

/** Legacy `onBook` final transforms before proxy send. */
export function prepareHotelBookSubmitDto(dto: HotelOrderBookDto): HotelOrderBookDto {
  const passengers = dto.Passengers.map((passenger) => {
    const approvalRaw = passenger.ApprovalId;
    const approvalId =
      approvalRaw == null || approvalRaw === ""
        ? 0
        : Number.isFinite(Number(approvalRaw))
          ? Number(approvalRaw)
          : approvalRaw;

    const { Linkmans: _ignored, ...rest } = passenger as HotelBookPassengerDto & {
      Linkmans?: unknown;
    };

    return {
      ...rest,
      ApprovalId: approvalId,
    };
  });

  return {
    ...dto,
    Channel: dto.Channel ?? HOTEL_BOOK_CHANNEL,
    TravelPayType: dto.TravelPayType ?? passengers[0]?.TravelPayType,
    Passengers: passengers,
  };
}

function formatArrivalTimeSlot(datePart: string, hour: number, minute: number): string {
  return `${datePart} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** Legacy `initArrivalTimes` — 30-min slots from check-in day 14:00 through next day 06:00. */
export function buildHotelArrivalTimeSlots(checkIn: string): string[] {
  const checkInDate = checkIn.slice(0, 10);
  const nextDate = addDays(checkInDate, 1);
  const slots: string[] = [];

  for (let hour = 14; hour <= 23; hour += 1) {
    for (const minute of [0, 30]) {
      slots.push(formatArrivalTimeSlot(checkInDate, hour, minute));
    }
  }

  for (let hour = 0; hour <= 6; hour += 1) {
    for (const minute of [0, 30]) {
      if (hour === 6 && minute === 30) continue;
      slots.push(formatArrivalTimeSlot(nextDate, hour, minute));
    }
  }

  return slots;
}

export function resolveHotelArrivalTimeOptions(
  _selection: HotelBookSelection,
  checkIn: string,
): string[] {
  return buildHotelArrivalTimeSlots(checkIn);
}

export function calcHotelNights(checkIn: string, checkOut: string): number {
  const start = new Date(`${checkIn.slice(0, 10)}T00:00:00`);
  const end = new Date(`${checkOut.slice(0, 10)}T00:00:00`);
  const diff = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  return Math.max(diff, 1);
}

export function resolveHotelPaymentTypeLabel(paymentType?: number): string | null {
  if (paymentType === HOTEL_PAYMENT_SELF_PAY) return "到店付";
  if (paymentType === HOTEL_PAYMENT_PREPAY) return "预付";
  if (paymentType === HOTEL_PAYMENT_SETTLE) return "月付";
  return null;
}

export function resolvePassengerServiceFee(
  passenger: PassengerBookInfo,
  serviceFees?: Record<string, number | string>,
): number {
  if (!serviceFees) return 0;
  const clientId = resolveHotelInitClientId(passenger);
  const fee = serviceFees[clientId] ?? serviceFees[passenger.id];
  if (fee == null) return 0;
  const numeric = typeof fee === "number" ? fee : Number(fee);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function resolveTotalHotelServiceFee(
  passengers: PassengerBookInfo[],
  serviceFees?: Record<string, number | string>,
): number {
  return passengers.reduce(
    (sum, passenger) => sum + resolvePassengerServiceFee(passenger, serviceFees),
    0,
  );
}

export interface HotelBillNight {
  date: string;
  price: number;
}

export function resolveHotelBillNights(selection: HotelBookSelection): HotelBillNight[] {
  const prices = selection.plan.RoomPlanPrices ?? [];
  if (prices.length > 0) {
    return prices
      .map((item) => ({
        date: item.Date?.slice(0, 10) ?? "",
        price: Number(item.Price) || 0,
      }))
      .filter((item) => item.date);
  }

  const nights = calcHotelNights(selection.checkIn, selection.checkOut);
  const nightly = (selection.plan.TotalAmount ?? selection.plan.Price) / nights;
  const start = new Date(`${selection.checkIn.slice(0, 10)}T00:00:00`);
  return Array.from({ length: nights }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      date: date.toISOString().slice(0, 10),
      price: nightly,
    };
  });
}

export function resolveHotelBookDisplayAmount(input: {
  init?: HotelInitBookResponse;
  selection: HotelBookSelection;
  passengers: PassengerBookInfo[];
  roomCount?: number;
}): number {
  if (input.init?.OrderAmount != null) {
    const amount = Number(input.init.OrderAmount);
    if (Number.isFinite(amount)) return amount;
  }
  const roomCount = input.roomCount ?? (input.passengers.length || 1);
  const perRoom = input.selection.plan.TotalAmount ?? input.selection.plan.Price;
  return perRoom * roomCount;
}

export function buildHotelPassengerOutNumberFieldsMap(input: {
  passengers: PassengerBookInfo[];
  staffs?: HotelInitStaff[];
  init?: HotelInitBookResponse;
}): Record<string, FlightOutNumberField[]> {
  const map: Record<string, FlightOutNumberField[]> = {};
  for (const passenger of input.passengers) {
    const accountId = resolveHotelInitClientId(passenger);
    const hotelStaff = input.staffs?.find((staff) => String(staff.Id) === accountId);
    const staff: FlightInitStaff | undefined = hotelStaff
      ? {
          Id: hotelStaff.Id,
          Name: hotelStaff.Name,
          Number: hotelStaff.Id,
          OutNumber: "",
          Account: { Id: hotelStaff.Id },
        }
      : undefined;
    map[passenger.id] = buildPassengerOutNumberFields({
      passenger,
      staff,
      init: input.init as FlightInitBookResponse | undefined,
    });
  }
  return map;
}

export function resolveHotelShowCreditCard(
  selection: HotelBookSelection,
  arrivalTime: string,
  init?: HotelInitBookResponse,
): boolean {
  const tmc = init?.Tmc as { IsShowCreditCard?: boolean } | undefined;
  if (tmc?.IsShowCreditCard === true) return true;
  if (tmc?.IsShowCreditCard === false) return false;

  if (selection.plan.PaymentType !== HOTEL_PAYMENT_SELF_PAY) return false;
  const timeMatch = arrivalTime.match(/(\d{1,2}):(\d{2})/);
  if (!timeMatch) return false;
  const hour = Number(timeMatch[1]);
  return hour >= 18;
}

export function createEmptyHotelCreditCardForm(): HotelCreditCardForm {
  return { cardNumber: "", holderName: "", expireDate: "", cvv: "" };
}

export function validateHotelCreditCard(card: HotelCreditCardForm): string | null {
  if (!card.cardNumber.trim()) return "请输入信用卡卡号";
  if (!card.holderName.trim()) return "请输入持卡人姓名";
  if (!card.expireDate.trim()) return "请输入有效期";
  if (!card.cvv.trim()) return "请输入安全码";
  return null;
}

export function createHotelPassengerBookForm(
  passenger: PassengerBookInfo,
  defaultArrivalTime: string,
): HotelPassengerBookForm {
  const accountMobile = passenger.credential.Mobile ?? passenger.passenger.Mobile ?? undefined;
  const mobileOptions = splitContactOptions(accountMobile);

  return {
    passengerId: passenger.id,
    expanded: false,
    arrivalTime: defaultArrivalTime,
    notifyLanguage: "cn",
    illegalReason: "",
    otherIllegalReason: "",
    expenseTypeId: "",
    roommate: "",
    mobileOptions,
    emailOptions: [],
    otherMobile: mobileOptions.length === 0 ? (accountMobile ?? "") : "",
    otherEmail: "",
    organization: {
      code: "",
      name: passenger.credential.OrgName ?? passenger.passenger.OrgName ?? "",
    },
    otherOrganizationName: "",
    costCenter: { code: "", name: "" },
    otherCostCenterName: "",
    otherCostCenterCode: "",
    approvalId: "",
    approvalName: "",
    isSkipApprove: false,
    outNumbers: {},
  };
}

export function validateHotelBookForms(input: {
  passengers: PassengerBookInfo[];
  forms: Record<string, HotelPassengerBookForm>;
  arrivalTime: string;
  init?: HotelInitBookResponse;
  requiresIllegalReason?: boolean;
  requiresApprover?: boolean;
  outNumberFieldsByPassenger?: Record<string, FlightOutNumberField[]>;
  showCreditCard?: boolean;
  creditCard?: HotelCreditCardForm;
  authorizedContactsByPassenger?: Record<string, FlightAuthorizedContact[]>;
}): string | null {
  if (!input.arrivalTime.trim()) {
    return "请选择到店时间";
  }

  if (input.showCreditCard && input.creditCard) {
    const cardError = validateHotelCreditCard(input.creditCard);
    if (cardError) return cardError;
  }

  for (const passenger of input.passengers) {
    const form = input.forms[passenger.id];
    if (!form) continue;

    const mobile = resolvePassengerFormMobile(form as FlightPassengerBookForm);
    if (!mobile) {
      const roomIndex = input.passengers.indexOf(passenger) + 1;
      return `房间${roomIndex}联系电话不能为空`;
    }

    if (input.requiresApprover && !form.isSkipApprove && !form.approvalId) {
      return "请选择审批人";
    }

    if (input.requiresIllegalReason && !form.illegalReason && !form.otherIllegalReason) {
      return "请填写超标原因";
    }

    const outNumberFields = input.outNumberFieldsByPassenger?.[passenger.id] ?? [];
    const outNumberError = validatePassengerOutNumbers(outNumberFields, form.outNumbers);
    if (outNumberError) return outNumberError;

    const roomContacts = input.authorizedContactsByPassenger?.[passenger.id] ?? [];
    const contactError = validateAuthorizedContacts(roomContacts);
    if (contactError) {
      const roomIndex = input.passengers.indexOf(passenger) + 1;
      return `房间${roomIndex}${contactError}`;
    }
  }

  return null;
}

/** Legacy `warranty` — non-refundable cancel copy shown in the warm-reminder dialog. */
export const HOTEL_WARM_REMINDER_CANCEL_NON_REFUNDABLE =
  "您的订单一经确认，不可取消；如未能如约入住，将收取全额房费作为违约费用。";

/** Legacy `warranty` — default booking / prepay notice when API text is absent. */
export const HOTEL_WARM_REMINDER_BOOKING_DEFAULT =
  "预订提示：您的订单需等酒店或供应商确认后才能生效，确认结果以短信或本应用显示的订单状态为准，请在订单预订成功后再至酒店前台办理入住。在线支付说明：本产品为向酒店或供应商申请的特殊价格，无法确保预订成功，完成支付后若预订不成功，房费将原路退还至付款账户中。";

export interface HotelWarmReminderSection {
  id: string;
  title: string;
  accentClass: string;
  content: string;
}

function splitWarmReminderBookingCopy(raw: string): { booking: string; payment?: string } {
  const paymentMatch = raw.match(/在线支付说明[：:]\s*(.+)$/);
  const bookingMatch = raw.match(/预订提示[：:]\s*(.+?)(?=在线支付说明|$)/s);

  return {
    booking: bookingMatch?.[1]?.trim() || raw.trim(),
    payment: paymentMatch?.[1]?.trim(),
  };
}

export interface BuildHotelWarmReminderInput {
  cancelRule?: string;
  /** Legacy `getRoomPlanRulesDesc` — joined RoomPlanRules descriptions. */
  roomPlanRulesDesc?: string;
}

/** Legacy `getRoomPlanRulesDesc` — prefer RoomPlanRules, then RoomRateRule / CancelPolicy. */
export function resolveHotelRoomPlanRulesDesc(
  plan?: Pick<HotelRoomPlan, "RoomPlanRules" | "VariablesObj" | "CancelPolicy">,
): string {
  const rules = (plan?.RoomPlanRules ?? []).map((item) => item.Description?.trim()).filter(Boolean);
  if (rules.length) return rules.join(" ");

  const rateRule = plan?.VariablesObj?.RoomRateRule;
  if (typeof rateRule === "string" && rateRule.trim()) return rateRule.trim();

  return plan?.CancelPolicy?.trim() ?? "";
}

export function buildHotelWarmReminderSections(
  input?: BuildHotelWarmReminderInput | string,
): HotelWarmReminderSection[] {
  const resolved = typeof input === "string" ? { cancelRule: input } : (input ?? {});
  const rulesDesc = resolved.roomPlanRulesDesc?.trim();
  const cancelRule = resolved.cancelRule?.trim();

  const rawCancel = rulesDesc || cancelRule || "";
  const cancelContent =
    !rawCancel || /不可取消|预订后不可|不可退/.test(rawCancel)
      ? HOTEL_WARM_REMINDER_CANCEL_NON_REFUNDABLE
      : rawCancel;

  const { booking, payment } = splitWarmReminderBookingCopy(HOTEL_WARM_REMINDER_BOOKING_DEFAULT);

  const sections: HotelWarmReminderSection[] = [
    {
      id: "cancel",
      title: "取消政策",
      accentClass: "bg-[#FF4D4F]",
      content: cancelContent,
    },
    {
      id: "booking",
      title: "预订提示",
      accentClass: "bg-[#2768FA]",
      content: booking,
    },
  ];

  if (payment) {
    sections.push({
      id: "payment",
      title: "在线支付说明",
      accentClass: "bg-[#EA580C]",
      content: payment,
    });
  }

  return sections;
}

/** @deprecated Use `buildHotelWarmReminderSections` for structured dialog content. */
export function buildHotelWarmReminderParagraphs(cancelRule?: string): string[] {
  return buildHotelWarmReminderSections(cancelRule).map((section) => section.content);
}

export function resolveHotelBookOrderId(response: HotelBookResponse): string {
  return String(response.TradeNo || response.OrderId || "");
}
