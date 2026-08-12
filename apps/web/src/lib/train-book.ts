import type {
  FlightAuthorizedContact,
  FlightOutNumberField,
  FlightInitBookResponse,
  FlightPassengerContactOption,
  PassengerBookInfo,
  TrainBookEntityDto,
  TrainBookLinkmanDto,
  TrainBookPassengerDto,
  TrainBookPolicy,
  TrainInitBookResponse,
  TrainOrderBookDto,
} from "@ryx/shared-types";
import { canSelectTrainSeatType, credentialDisplayNumber } from "@ryx/shared-types";
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
import {
  resolveTrainPassengerApprovalId,
  shouldAllowSelectTrainApprover,
  validatePassengerTrainApprover,
} from "@/lib/train-book-approval";
import type { HomeTravelMode } from "@/config/home-assets";
import type { TrainBookSelection } from "@/lib/train-book-session";

export const TRAIN_BOOK_CHANNEL = "客户H5";
const BERTH_SUFFIX_PATTERN = /[上中下]$/;

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
  return String(info.id ?? "");
}

export function resolveTrainAccountId(info: PassengerBookInfo): string {
  const accountId =
    ("AccountId" in info.passenger ? info.passenger.AccountId : undefined) ??
    info.credential.AccountId;
  return String(accountId ?? info.credential.Id ?? info.id ?? "");
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

function buildOriginalSearchResultSeatsFromSnapshot(
  snapshotSeats: Record<string, unknown>[],
): TrainBookEntityDto["OriginalSearchResultSeats"] {
  return snapshotSeats.map((seat) => {
    const SeatTypeName =
      typeof seat.SeatTypeName === "string"
        ? seat.SeatTypeName.replace(BERTH_SUFFIX_PATTERN, "")
        : seat.SeatTypeName;
    return {
      ...seat,
      ...(SeatTypeName != null ? { SeatTypeName } : {}),
    };
  }) as TrainBookEntityDto["OriginalSearchResultSeats"];
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
    entity.OriginalSearchResultSeats = snapshotSeats.length
      ? buildOriginalSearchResultSeatsFromSnapshot(snapshotSeats)
      : buildOriginalSearchResultSeats(displaySeats);
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
): TrainBookPassengerDto["Credentials"] {
  const accountId = resolveTrainAccountId(info);
  const credentials = buildSubmitCredentials(info, accountId) as
    | (TrainBookPassengerDto["Credentials"] & { Mobile?: unknown })
    | undefined;
  if (!credentials) return credentials;
  const { Mobile: _mobile, ...rest } = credentials;
  return rest as TrainBookPassengerDto["Credentials"];
}

function resolveTrainPassengerFormMobile(form?: TrainPassengerBookForm, fallback?: string): string {
  const checked =
    form?.mobileOptions.filter((item) => item.checked).map((item) => item.value) ?? [];
  let mobile = checked.join(",");
  if (form?.otherMobile.trim()) {
    mobile = mobile ? `${mobile},${form.otherMobile.trim()}` : form.otherMobile.trim();
  }
  return mobile || fallback || "";
}

/** Legacy exchange contact fallback: init staff mobile → passenger mobile → original ticket mobile. */
export function resolveTrainPassengerMobileFallback(
  passenger: PassengerBookInfo,
  init?: TrainInitBookResponse,
  exchangePassengerMobile?: string,
): string {
  const staff = findInitStaffForPassenger(passenger, init?.Staffs);
  const staffMobile = staff?.Account?.Mobile?.trim();
  if (staffMobile) return staffMobile;

  const credentialMobile = passenger.credential.Mobile?.trim();
  if (credentialMobile) return credentialMobile;

  const passengerMobile =
    "Mobile" in passenger.passenger && typeof passenger.passenger.Mobile === "string"
      ? passenger.passenger.Mobile.trim()
      : "";
  if (passengerMobile) return passengerMobile;

  return exchangePassengerMobile?.trim() ?? "";
}

export function mergeTrainPassengerContactIntoForm(
  form: TrainPassengerBookForm,
  passenger: PassengerBookInfo,
  options?: { init?: TrainInitBookResponse; exchangePassengerMobile?: string },
): TrainPassengerBookForm {
  if (resolveTrainPassengerFormMobile(form)) return form;

  const fallback = resolveTrainPassengerMobileFallback(
    passenger,
    options?.init,
    options?.exchangePassengerMobile,
  );
  if (!fallback) return form;

  const mobileOptions = splitContactOptions(fallback);
  return {
    ...form,
    mobileOptions,
    otherMobile: mobileOptions.length === 0 ? fallback : form.otherMobile,
  };
}

function resolveTrainPassengerFormEmail(form?: TrainPassengerBookForm): string {
  const checked = form?.emailOptions.filter((item) => item.checked).map((item) => item.value) ?? [];
  let email = checked.join(",");
  if (form?.otherEmail.trim()) {
    email = email ? `${email},${form.otherEmail.trim()}` : form.otherEmail.trim();
  }
  return email;
}

function splitTrainContactMobiles(mobile: string): string[] {
  return mobile
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildLegacyDefaultBookSeatLocations(
  passengerCount: number,
  selectedLocations?: string[],
): string[] {
  const explicit = new Set(
    (selectedLocations ?? [])
      .map((item) => formatBookSeatLocation(item))
      .filter((item): item is string => Boolean(item)),
  );
  const fallbackPool = ["1A", "1B", "1C", "1D", "1F", "2A", "2B", "2C", "2D", "2F"].filter(
    (item) => !explicit.has(item),
  );

  return Array.from({ length: passengerCount }, (_, index) => {
    const selected = formatBookSeatLocation(selectedLocations?.[index]);
    return selected ?? fallbackPool.pop() ?? "";
  });
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
  agentId?: string | number;
  travelMode?: HomeTravelMode;
  channel?: "tmc" | "tourist";
  includeTrainOnlyPassenger?: boolean;
  ticketId?: string;
}): TrainOrderBookDto {
  const {
    selection,
    passengers,
    travelFormId,
    agentId,
    travelMode,
    channel,
    includeTrainOnlyPassenger,
    ticketId,
  } = input;
  const includeTravelForm = isBusinessTravelMode(travelMode);
  const trainEntity = buildTrainBookEntity(selection);

  const passengerDtos: TrainBookPassengerDto[] = passengers.map((info) => {
    const cred = info.credential;
    const clientId = resolveTrainInitClientId(info);
    const passengerTravelFormId = includeTravelForm
      ? (travelFormId ??
        ("travelFormId" in info.passenger ? info.passenger.travelFormId : undefined))
      : undefined;
    const passengerPolicy = buildTrainPassengerPolicy(info);

    const passengerDto: TrainBookPassengerDto = {
      ClientId: clientId,
      Train: { ...trainEntity },
      Credentials: buildTrainPassengerCredentials(info),
      Mobile: cred.Mobile,
      Policy: passengerPolicy,
    };
    if (includeTravelForm && passengerTravelFormId)
      passengerDto.travelFormId = passengerTravelFormId;
    return passengerDto;
  });
  if (passengerDtos.length === 0 && includeTrainOnlyPassenger) {
    passengerDtos.push({
      ClientId: String(
        selection.train.Id ?? selection.train.TrainNo ?? selection.train.TrainCode ?? "train",
      ),
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
  if (ticketId) dto.TicketId = ticketId;
  return dto;
}

export function buildTrainOrderBookDto(input: {
  selection: TrainBookSelection;
  passengers: PassengerBookInfo[];
  passengerForms?: Record<string, TrainPassengerBookForm>;
  travelFormId?: string;
  travelPayType?: number;
  authorizedContacts?: FlightAuthorizedContact[];
  agentId?: string | number;
  bookSeatLocations?: string[];
  isOfficialBooked?: boolean;
  accountNumber12306?: string;
  globalNotifyLanguage?: TrainPassengerBookForm["notifyLanguage"];
  exchangeTicketId?: string;
  travelMode?: HomeTravelMode;
  channel?: "tmc" | "tourist";
  orderLinkman?: TrainBookLinkmanDto;
  init?: TrainInitBookResponse;
  isExchangeBook?: boolean;
  exchangePassengerMobile?: string;
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
    init,
    isExchangeBook,
  } = input;
  const includeTravelForm = isBusinessTravelMode(travelMode);
  const policy = selection.policy;
  const normalizedOrderLinkman = normalizeOrderLinkman(orderLinkman);

  const trainEntityBase = buildTrainBookEntity(selection);
  const rules = selection.policy?.Rules?.filter(Boolean) ?? [];
  const illegalPolicy = rules.length ? rules.join(",") : undefined;
  const legacyBookSeatLocations =
    channel === "tourist"
      ? buildLegacyDefaultBookSeatLocations(passengers.length, bookSeatLocations)
      : undefined;

  const passengerDtos: TrainBookPassengerDto[] = passengers.map((info, index) => {
    const clientId = resolveTrainInitClientId(info);
    const form = passengerForms?.[info.id];
    const mobile = resolveTrainPassengerFormMobile(
      form,
      resolveTrainPassengerMobileFallback(
        info,
        init,
        isExchangeBook ? input.exchangePassengerMobile : undefined,
      ),
    );
    const email = resolveTrainPassengerFormEmail(form);
    const seatPreference = legacyBookSeatLocations?.[index] ?? bookSeatLocations?.[index]?.trim();
    const passengerPolicy = buildTrainPassengerPolicy(info);
    const staff = findInitStaffForPassenger(info, init?.Staffs);
    const showApproverPicker =
      includeTravelForm &&
      shouldAllowSelectTrainApprover({
        init,
        policy,
        staff,
        passenger: info,
        isExchangeBook,
      });

    const passengerDto: TrainBookPassengerDto = {
      ClientId: clientId,
      Train: {
        ...trainEntityBase,
        BookSeatLocation: seatPreference ? (formatBookSeatLocation(seatPreference) ?? "") : "",
      },
      Credentials: buildTrainPassengerCredentials(info),
      Mobile: mobile,
      Email: email || undefined,
      MessageLang: globalNotifyLanguage ?? form?.notifyLanguage ?? "cn",
      Policy: passengerPolicy,
      IllegalPolicy: illegalPolicy,
      IllegalReason: includeTravelForm
        ? form?.illegalReason || form?.otherIllegalReason || undefined
        : undefined,
      ExpenseType: includeTravelForm ? form?.expenseTypeId || undefined : undefined,
      ApprovalId: includeTravelForm
        ? resolveTrainPassengerApprovalId({ form, showPicker: showApproverPicker })
        : undefined,
      IsSkipApprove: includeTravelForm && showApproverPicker ? form?.isSkipApprove : undefined,
      TravelType: resolveFlightTravelType(travelMode),
      CostCenterCode: includeTravelForm
        ? form?.costCenter.code || form?.otherCostCenterCode || undefined
        : undefined,
      CostCenterName: includeTravelForm
        ? form?.costCenter.name || form?.otherCostCenterName || undefined
        : undefined,
      OrganizationName: includeTravelForm
        ? form?.organization.name ||
          form?.otherOrganizationName ||
          (typeof (info.passenger as { OrgName?: string }).OrgName === "string"
            ? (info.passenger as { OrgName?: string }).OrgName
            : undefined)
        : undefined,
      OrganizationCode: includeTravelForm ? form?.organization.code || undefined : undefined,
      OutNumbers:
        includeTravelForm && form?.outNumbers && Object.keys(form.outNumbers).length > 0
          ? form.outNumbers
          : null,
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
    dto.TicketId = exchangeTicketId;
  }
  return dto;
}

export function buildTrainPassengerOutNumberFieldsMap(
  init: TrainInitBookResponse | undefined,
  passengers: PassengerBookInfo[],
  travelMode?: HomeTravelMode,
): Record<string, FlightOutNumberField[]> {
  const initAsFlight = init as FlightInitBookResponse | undefined;
  const sharedTravelNumber =
    typeof initAsFlight?.TravelFrom?.TravelNumber === "string"
      ? initAsFlight.TravelFrom.TravelNumber
      : undefined;
  const map: Record<string, FlightOutNumberField[]> = {};
  for (const passenger of passengers) {
    const staff = findInitStaffForPassenger(passenger, init?.Staffs);
    const passengerTravelNumber =
      "travelNumber" in passenger.passenger && passenger.passenger.travelNumber
        ? String(passenger.passenger.travelNumber)
        : undefined;
    map[passenger.id] = buildPassengerOutNumberFields({
      passenger,
      staff,
      init: initAsFlight,
      travelNumber: sharedTravelNumber ?? passengerTravelNumber,
      travelMode,
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
  init?: TrainInitBookResponse;
  policy?: TrainBookPolicy;
  isExchangeBook?: boolean;
  isBusinessMode?: boolean;
  requireIllegalReason: boolean;
  exchangePassengerMobile?: string;
}): string | null {
  const {
    passengers,
    forms,
    outNumberFieldsByPassenger,
    authorizedContacts,
    orderLinkman,
    requireOrderLinkman,
    init,
    policy,
    isExchangeBook,
    isBusinessMode = true,
    requireIllegalReason,
    exchangePassengerMobile,
  } = input;

  const passengerMobileOwners = new Map<string, string>();

  for (const passenger of passengers) {
    const form = forms[passenger.id];
    if (!form) return "请完善旅客信息";

    const mobile = resolveTrainPassengerFormMobile(
      form,
      resolveTrainPassengerMobileFallback(
        passenger,
        init,
        isExchangeBook ? exchangePassengerMobile : undefined,
      ),
    );
    if (!mobile) return `请填写${passenger.credential.Name ?? "旅客"}联系电话`;
    const passengerName = passenger.credential.Name ?? "旅客";
    for (const item of splitTrainContactMobiles(mobile)) {
      const firstOwner = passengerMobileOwners.get(item);
      if (firstOwner) return `${firstOwner}与${passengerName}联系电话不能重复`;
      passengerMobileOwners.set(item, passengerName);
    }

    if (isBusinessMode) {
      const staff = findInitStaffForPassenger(passenger, init?.Staffs);
      const showApproverPicker = shouldAllowSelectTrainApprover({
        init,
        policy,
        staff,
        passenger,
        isExchangeBook,
      });
      const approverError = validatePassengerTrainApprover({
        form,
        showPicker: showApproverPicker,
      });
      if (approverError) {
        return `请选择${passenger.credential.Name ?? "旅客"}审批人`;
      }
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
    const normalizedLinkman = normalizeOrderLinkman(orderLinkman);
    for (const item of splitTrainContactMobiles(normalizedLinkman?.Mobile ?? "")) {
      if (passengerMobileOwners.has(item)) return "联系人手机号不能与乘车人联系电话重复";
    }
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
  /** Original ticket amount deducted in exchange flow (legacy TicketPrice). */
  originalTicketCredit?: number;
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

export interface TrainExchangeBookPricingInput {
  selection: TrainBookSelection;
  passengers: PassengerBookInfo[];
  serviceFees?: Record<string, number | string>;
  originalTicketPrice?: number;
  exchangeOnlineFee?: number;
}

/** Legacy calcTotalPrice for exchange: new fare + fees − original TicketPrice. */
export function resolveTrainExchangeBookBillBreakdown(
  input: TrainExchangeBookPricingInput,
): TrainBookBillBreakdown {
  const base = resolveTrainBookBillBreakdown(input);
  let total = base.total;

  if (input.exchangeOnlineFee !== undefined) {
    const regularServiceTotal = base.passengers.reduce((sum, bill) => sum + bill.serviceFee, 0);
    total = total - regularServiceTotal + toBillAmount(input.exchangeOnlineFee);
  }

  const originalPrice = toBillAmount(input.originalTicketPrice);
  if (originalPrice > 0) {
    total -= originalPrice;
  }

  return {
    ...base,
    total,
    originalTicketCredit: originalPrice > 0 ? originalPrice : undefined,
  };
}

export function resolveTrainExchangeBookDisplayAmount(
  input: TrainExchangeBookPricingInput,
): number {
  if (input.passengers.length === 0) return 0;
  return resolveTrainExchangeBookBillBreakdown(input).total;
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

export function createTrainPassengerBookForm(
  passenger: PassengerBookInfo,
  options?: { init?: TrainInitBookResponse; exchangePassengerMobile?: string },
): TrainPassengerBookForm {
  const accountMobile = resolveTrainPassengerMobileFallback(
    passenger,
    options?.init,
    options?.exchangePassengerMobile,
  );
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
