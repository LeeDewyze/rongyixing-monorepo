import type {
  FlightAuthorizedContact,
  FlightInitStaff,
  FlightOutNumberField,
  FlightInitBookResponse,
  FlightPassengerContactOption,
  PassengerBookInfo,
  TrainBookEntityDto,
  TrainBookLinkmanDto,
  TrainBookPassengerDto,
  TrainInitBookResponse,
  TrainOrderBookDto,
} from "@ryx/shared-types";
import {
  canSelectTrainSeatType,
  credentialDisplayNumber,
} from "@ryx/shared-types";
import { buildOriginalSearchResultSeats, formatBookSeatLocation } from "@ryx/api";

import { buildSubmitCredentials } from "@/lib/flight-book";
import { resolvePassengerTravelPolicy } from "@/lib/flight-book-cabin";
import {
  buildPassengerOutNumberFields,
  validatePassengerOutNumbers,
} from "@/lib/flight-book-outnumber";
import { splitContactOptions, findInitStaffForPassenger } from "@/lib/flight-book-passenger-form";
import { buildAuthorizedLinkmans, validateAuthorizedContacts } from "@/lib/flight-book-contacts";
import { isBusinessTravelMode, resolveFlightTravelType } from "@/lib/flight-travel-mode";
import type { TrainBookSelection } from "@/lib/train-book-session";
import type { HomeTravelMode } from "@/config/home-assets";

export const TRAIN_BOOK_CHANNEL = "客户H5";

export { canSelectTrainSeatType as canSelectTrainSeat };

/** Aligned with hotel book passenger detail fields (minus arrival time). */
export interface TrainPassengerBookForm {
  passengerId: string;
  expanded: boolean;
  notifyLanguage: "" | "cn" | "en";
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

/** Legacy Initialize ClientId — passenger selection id (api.md), not AccountId. */
export function resolveTrainInitClientId(info: PassengerBookInfo): string {
  return String(info.id);
}

export function resolveTrainAccountId(info: PassengerBookInfo): string {
  const accountId =
    ("AccountId" in info.passenger ? info.passenger.AccountId : undefined) ??
    info.credential.AccountId;
  return String(accountId ?? info.credential.Id ?? info.id);
}

export function resolvePassengerServiceFee(
  passenger: PassengerBookInfo,
  serviceFees?: Record<string, number | string>,
): number {
  if (!serviceFees) return 0;
  const accountId = resolveTrainAccountId(passenger);
  const fee = serviceFees[accountId] ?? serviceFees.default ?? serviceFees[passenger.id];
  if (typeof fee === "number") return fee;
  if (typeof fee === "string" && fee.trim()) {
    const parsed = Number(fee);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function passengerRequiresTrainApprover(
  passenger: PassengerBookInfo,
  staffs: FlightInitStaff[] | undefined,
): boolean {
  const staff = findInitStaffForPassenger(passenger, staffs);
  return Boolean(staff?.Approvers?.length);
}

function mergeSeatPoliciesOntoSnapshot(
  snapshotSeats: Record<string, unknown>[],
  displaySeats: TrainBookSelection["train"]["Seats"],
): Record<string, unknown>[] {
  const seats = displaySeats ?? [];
  return snapshotSeats.map((rawSeat) => {
    const seatType = rawSeat.SeatType;
    const display =
      seats.find((item) => item.SeatType === seatType) ??
      seats.find((item) => item.SeatTypeName === rawSeat.SeatTypeName);
    const next = { ...rawSeat };
    if (display?.policy) {
      next.Policy = display.policy;
    }
    if (display?.policyColor) {
      next.color = display.policyColor;
    }
    return next;
  });
}

/** Build Train entity from Home-Search snapshot — aligned with legacy Initialize api.md. */
export function buildTrainBookEntity(
  selection: TrainBookSelection,
  options?: { bookSeatLocation?: string },
): TrainBookEntityDto {
  const { train, seat } = selection;
  const displaySeats = train.Seats ?? [seat];
  const snapshot = selection.trainSnapshot ?? train.searchSnapshot;

  if (snapshot) {
    const entity = JSON.parse(JSON.stringify(snapshot)) as Record<string, unknown>;
    const snapshotSeats = Array.isArray(entity.Seats)
      ? (entity.Seats as Record<string, unknown>[])
      : [];
    entity.Seats = mergeSeatPoliciesOntoSnapshot(snapshotSeats, displaySeats);
    entity.OriginalSearchResultSeats = buildOriginalSearchResultSeats(displaySeats);
    entity.BookSeatType = seat.SeatType;
    entity.BookSeatLocation = options?.bookSeatLocation ?? "";
    return entity as TrainBookEntityDto;
  }

  const originalSeats = buildOriginalSearchResultSeats(displaySeats);
  return {
    ...buildTrainEntityBase(selection),
    Seats: originalSeats,
    OriginalSearchResultSeats: originalSeats,
    BookSeatType: seat.SeatType,
    BookSeatLocation: options?.bookSeatLocation ?? "",
  };
}

function buildTrainEntityBase(selection: TrainBookSelection): TrainBookEntityDto {
  const { train, seat, searchParams } = selection;

  return {
    TrainNo: train.TrainNo ?? train.TrainCode,
    TrainCode: train.TrainCode,
    StartTime: train.StartTime,
    ArrivalTime: train.ArrivalTime,
    FromStation: train.FromStation,
    ToStation: train.ToStation,
    FromStationCode: train.FromStationCode ?? searchParams.FromStation,
    ToStationCode: train.ToStationCode ?? searchParams.ToStation,
    FromStationName: train.FromStation,
    ToStationName: train.ToStation,
    TravelTimeName: train.Duration,
    ArriveDays: train.ArriveDays,
    BookSeatType: seat.SeatType,
  };
}

function buildTrainPassengerPolicy(info: PassengerBookInfo): Record<string, unknown> | undefined {
  return resolvePassengerTravelPolicy(info);
}

function buildTrainPassengerCredentials(
  info: PassengerBookInfo,
  mobile?: string,
): TrainBookPassengerDto["Credentials"] {
  const accountId = resolveTrainAccountId(info);
  const credentials = buildSubmitCredentials(info, accountId) as TrainBookPassengerDto["Credentials"];
  if (!credentials) return credentials;
  if (mobile) {
    return { ...credentials, Mobile: mobile };
  }
  return credentials;
}

function resolveTrainPassengerFormMobile(
  form?: TrainPassengerBookForm,
  fallback?: string,
): string {
  const checked = form?.mobileOptions.filter((item) => item.checked).map((item) => item.value) ?? [];
  let mobile = checked.join(",");
  if (form?.otherMobile.trim()) {
    mobile = mobile ? `${mobile},${form.otherMobile.trim()}` : form.otherMobile.trim();
  }
  return mobile || fallback || "";
}

function resolveTrainPassengerFormEmail(form?: TrainPassengerBookForm): string {
  const checked = form?.emailOptions.filter((item) => item.checked).map((item) => item.value) ?? [];
  let email = checked.join(",");
  if (form?.otherEmail.trim()) {
    email = email ? `${email},${form.otherEmail.trim()}` : form.otherEmail.trim();
  }
  return email;
}

function normalizeOrderLinkman(linkman?: TrainBookLinkmanDto): TrainBookLinkmanDto | null {
  const Name = linkman?.Name?.trim() ?? "";
  const Mobile = linkman?.Mobile?.trim() ?? "";
  const Email = linkman?.Email?.trim() ?? "";
  if (!Name && !Mobile && !Email) return null;
  return {
    Name,
    Mobile,
    Email: Email || undefined,
  };
}

function validateOrderLinkman(linkman?: TrainBookLinkmanDto): string | null {
  const normalized = normalizeOrderLinkman(linkman);
  if (!normalized?.Name) return "请填写联系人姓名";
  if (!normalized.Mobile) return "请填写联系人手机号";
  if (!/^1\d{10}$/.test(normalized.Mobile)) return "请输入正确的联系人手机号";
  return null;
}

export function buildTrainInitBookDto(input: {
  selection: TrainBookSelection;
  passengers: PassengerBookInfo[];
  travelFormId?: string;
  agentId?: string;
  travelMode?: HomeTravelMode;
  channel?: "tmc" | "tourist";
  includeTrainOnlyPassenger?: boolean;
}): TrainOrderBookDto {
  const {
    selection,
    passengers,
    travelFormId,
    agentId,
    travelMode,
    channel,
    includeTrainOnlyPassenger,
  } = input;
  const includeTravelForm = isBusinessTravelMode(travelMode);
  const trainEntity = buildTrainBookEntity(selection);

  const passengerDtos: TrainBookPassengerDto[] = passengers.map((info) => {
    const cred = info.credential;
    const clientId = resolveTrainInitClientId(info);
    const passengerTravelFormId = includeTravelForm
      ? travelFormId ?? ("travelFormId" in info.passenger ? info.passenger.travelFormId : undefined)
      : undefined;
    const passengerPolicy = buildTrainPassengerPolicy(info);

    const passengerDto: TrainBookPassengerDto = {
      ClientId: clientId,
      Train: { ...trainEntity },
      Credentials: buildTrainPassengerCredentials(info),
      Mobile: cred.Mobile,
      Policy: passengerPolicy,
    };
    if (includeTravelForm && passengerTravelFormId) passengerDto.travelFormId = passengerTravelFormId;
    return passengerDto;
  });
  if (passengerDtos.length === 0 && includeTrainOnlyPassenger) {
    passengerDtos.push({
      ClientId: String(selection.train.Id ?? selection.train.TrainNo ?? selection.train.TrainCode ?? "train"),
      Train: { ...trainEntity },
      Policy: selection.policy as Record<string, unknown> | undefined,
    });
  }

  const dto: TrainOrderBookDto = {
    Passengers: passengerDtos,
  };
  if (channel) {
    dto.channel = channel;
  }
  if (includeTravelForm) {
    dto.TravelFormId =
      travelFormId ?? passengerDtos.find((passenger) => passenger.travelFormId)?.travelFormId ?? "";
  }

  if (agentId) dto.AgentId = agentId;
  return dto;
}

export function buildTrainOrderBookDto(input: {
  selection: TrainBookSelection;
  passengers: PassengerBookInfo[];
  passengerForms?: Record<string, TrainPassengerBookForm>;
  travelFormId?: string;
  travelPayType?: number;
  authorizedContacts?: FlightAuthorizedContact[];
  agentId?: string;
  bookSeatLocations?: string[];
  isOfficialBooked?: boolean;
  accountNumber12306?: string;
  globalNotifyLanguage?: TrainPassengerBookForm["notifyLanguage"];
  exchangeTicketId?: string;
  travelMode?: HomeTravelMode;
  channel?: "tmc" | "tourist";
  orderLinkman?: TrainBookLinkmanDto;
}): TrainOrderBookDto {
  const {
    selection,
    passengers,
    passengerForms,
    travelFormId,
    travelPayType,
    authorizedContacts,
    agentId,
    bookSeatLocations,
    isOfficialBooked,
    accountNumber12306,
    globalNotifyLanguage,
    exchangeTicketId,
    travelMode,
    channel,
    orderLinkman,
  } = input;
  const includeTravelForm = isBusinessTravelMode(travelMode);
  const normalizedOrderLinkman = normalizeOrderLinkman(orderLinkman);

  const trainEntityBase = buildTrainBookEntity(selection);
  const rules = selection.policy?.Rules?.filter(Boolean) ?? [];
  const illegalPolicy = rules.length ? rules.join(",") : undefined;

  const passengerDtos: TrainBookPassengerDto[] = passengers.map((info, index) => {
    const cred = info.credential;
    const clientId = resolveTrainInitClientId(info);
    const form = passengerForms?.[info.id];
    const mobile = resolveTrainPassengerFormMobile(form, cred.Mobile);
    const email = resolveTrainPassengerFormEmail(form);
    const seatPreference = bookSeatLocations?.[index]?.trim();
    const passengerPolicy = buildTrainPassengerPolicy(info);

    const passengerDto: TrainBookPassengerDto = {
      ClientId: clientId,
      Train: {
        ...trainEntityBase,
        BookSeatLocation: formatBookSeatLocation(seatPreference) ?? "",
      },
      Credentials: buildTrainPassengerCredentials(info, mobile),
      Mobile: mobile,
      Email: email || undefined,
      MessageLang: globalNotifyLanguage ?? form?.notifyLanguage ?? "cn",
      Policy: passengerPolicy,
      IllegalPolicy: illegalPolicy,
      IllegalReason: form?.illegalReason || form?.otherIllegalReason || undefined,
      ExpenseType: form?.expenseTypeId || undefined,
      ApprovalId: form?.approvalId || undefined,
      IsSkipApprove: form?.isSkipApprove,
      TravelType: resolveFlightTravelType(travelMode),
      CostCenterCode: form?.costCenter.code || form?.otherCostCenterCode || undefined,
      CostCenterName: form?.costCenter.name || form?.otherCostCenterName || undefined,
      OrganizationName:
        form?.organization.name ||
        form?.otherOrganizationName ||
        (typeof (info.passenger as { OrgName?: string }).OrgName === "string"
          ? (info.passenger as { OrgName?: string }).OrgName
          : undefined),
      OrganizationCode: form?.organization.code || undefined,
      OutNumbers:
        form?.outNumbers && Object.keys(form.outNumbers).length > 0 ? form.outNumbers : null,
    };
    if (includeTravelForm) {
      const passengerTravelFormId =
        travelFormId ??
        ("travelFormId" in info.passenger ? info.passenger.travelFormId : undefined);
      if (passengerTravelFormId) passengerDto.travelFormId = passengerTravelFormId;
    }
    return passengerDto;
  });

  const dto: TrainOrderBookDto = {
    Passengers: passengerDtos,
    Linkmans: normalizedOrderLinkman
      ? [normalizedOrderLinkman]
      : buildAuthorizedLinkmans(authorizedContacts ?? []),
    Channel: TRAIN_BOOK_CHANNEL,
    ...(channel ? { channel } : {}),
    TravelPayType: travelPayType,
    IsOfficialBooked: isOfficialBooked,
    AccountNumber: isOfficialBooked ? accountNumber12306 : undefined,
  };
  if (includeTravelForm) {
    dto.TravelFormId =
      travelFormId ?? passengerDtos.find((passenger) => passenger.travelFormId)?.travelFormId;
  }

  if (agentId) dto.AgentId = agentId;
  if (exchangeTicketId) {
    dto.IsExchange = true;
    dto.ExchangeTicketId = exchangeTicketId;
  }
  return dto;
}

export function buildTrainPassengerOutNumberFieldsMap(
  init: TrainInitBookResponse | undefined,
  passengers: PassengerBookInfo[],
): Record<string, FlightOutNumberField[]> {
  const map: Record<string, FlightOutNumberField[]> = {};
  for (const passenger of passengers) {
    const staff = init?.Staffs?.find((item) => item.Id === passenger.id) as
      | FlightInitStaff
      | undefined;
    map[passenger.id] = buildPassengerOutNumberFields({
      passenger,
      staff,
      init: init as FlightInitBookResponse | undefined,
      travelType: "Train",
    });
  }
  return map;
}

export function validateTrainBookForms(input: {
  passengers: PassengerBookInfo[];
  forms: Record<string, TrainPassengerBookForm>;
  outNumberFieldsByPassenger: Record<string, FlightOutNumberField[]>;
  authorizedContacts: FlightAuthorizedContact[];
  orderLinkman?: TrainBookLinkmanDto;
  requireOrderLinkman?: boolean;
  staffs?: FlightInitStaff[];
  requireIllegalReason: boolean;
}): string | null {
  const {
    passengers,
    forms,
    outNumberFieldsByPassenger,
    authorizedContacts,
    orderLinkman,
    requireOrderLinkman,
    staffs,
    requireIllegalReason,
  } = input;

  for (const passenger of passengers) {
    const form = forms[passenger.id];
    if (!form) return "请完善旅客信息";

    const mobile = resolveTrainPassengerFormMobile(form);
    if (!mobile) return `请填写${passenger.credential.Name ?? "旅客"}联系电话`;

    if (passengerRequiresTrainApprover(passenger, staffs) && !form.isSkipApprove && !form.approvalId) {
      return `请选择${passenger.credential.Name ?? "旅客"}审批人`;
    }

    if (requireIllegalReason && !form.illegalReason?.trim() && !form.otherIllegalReason?.trim()) {
      return "请填写超标原因";
    }
    const outError = validatePassengerOutNumbers(
      outNumberFieldsByPassenger[passenger.id] ?? [],
      form.outNumbers,
    );
    if (outError) return outError;
  }

  if (requireOrderLinkman) {
    const linkmanError = validateOrderLinkman(orderLinkman);
    if (linkmanError) return linkmanError;
  } else {
    const contactError = validateAuthorizedContacts(authorizedContacts);
    if (contactError) return contactError;
  }

  return null;
}

export interface TrainBookPassengerBill {
  passengerName: string;
  credentialNumber: string;
  fromStation: string;
  toStation: string;
  trainRouteLabel: string;
  seatTypeName: string;
  ticketPrice: number;
  serviceFee: number;
  subtotal: number;
}

export interface TrainBookBillBreakdown {
  passengers: TrainBookPassengerBill[];
  total: number;
}

function toBillAmount(value: unknown): number {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

export function resolveTrainBookBillBreakdown(input: {
  selection: TrainBookSelection;
  passengers: PassengerBookInfo[];
  serviceFees?: Record<string, number | string>;
}): TrainBookBillBreakdown {
  const { selection, passengers, serviceFees } = input;
  const { train, seat } = selection;
  const ticketPrice = toBillAmount(seat.Price);
  const fromStation = train.FromStation ?? "";
  const toStation = train.ToStation ?? "";
  const trainCode = train.TrainCode ?? train.TrainNo ?? "";
  const trainRouteLabel = `${trainCode}${fromStation}--${toStation}`;
  const seatTypeName = seat.SeatTypeName ?? "";

  const passengerBills = passengers.map((passenger) => {
    const serviceFee = resolvePassengerServiceFee(passenger, serviceFees);
    return {
      passengerName: passenger.credential.Name ?? passenger.passenger.Name ?? "",
      credentialNumber: credentialDisplayNumber(passenger.credential),
      fromStation,
      toStation,
      trainRouteLabel,
      seatTypeName,
      ticketPrice,
      serviceFee,
      subtotal: ticketPrice + serviceFee,
    };
  });

  return {
    passengers: passengerBills,
    total: passengerBills.reduce((sum, bill) => sum + bill.subtotal, 0),
  };
}

export function resolveTrainBookDisplayAmount(
  selection: TrainBookSelection,
  passengers: PassengerBookInfo[],
  serviceFees?: Record<string, number | string>,
): number {
  if (passengers.length === 0) return 0;
  return resolveTrainBookBillBreakdown({ selection, passengers, serviceFees }).total;
}

export function resolveTrainBookOrderId(
  response: { TradeNo?: string; OrderId?: string } | undefined,
): string {
  if (!response) return "";
  const tradeNo = response.TradeNo?.trim();
  if (tradeNo && tradeNo !== "0") return tradeNo;
  return response.OrderId?.trim() ?? "";
}

export function createTrainPassengerBookForm(passenger: PassengerBookInfo): TrainPassengerBookForm {
  const accountMobile = passenger.credential.Mobile ?? passenger.passenger.Mobile ?? undefined;
  const mobileOptions = splitContactOptions(accountMobile, passenger.credential.Mobile);

  return {
    passengerId: passenger.id,
    expanded: false,
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
      name:
        (typeof (passenger.credential as { OrgName?: string }).OrgName === "string"
          ? (passenger.credential as { OrgName?: string }).OrgName
          : undefined) ??
        (typeof (passenger.passenger as { OrgName?: string }).OrgName === "string"
          ? (passenger.passenger as { OrgName?: string }).OrgName
          : "") ??
        "",
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
