import type {
  FlightAuthorizedContact,
  FlightInitStaff,
  FlightOutNumberField,
  FlightInitBookResponse,
  FlightPassengerContactOption,
  FlightPassengerBookForm,
  PassengerBookInfo,
  TrainBookEntityDto,
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
import {
  resolvePassengerFormEmail,
  resolvePassengerFormMobile,
  splitContactOptions,
  findInitStaffForPassenger,
} from "@/lib/flight-book-passenger-form";
import { buildAuthorizedLinkmans, validateAuthorizedContacts } from "@/lib/flight-book-contacts";
import { resolveFlightTravelType } from "@/lib/flight-travel-mode";
import type { TrainBookSelection } from "@/lib/train-book-session";

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
  return Boolean(staff?.isAllowSelectApprove);
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

export function buildTrainInitBookDto(input: {
  selection: TrainBookSelection;
  passengers: PassengerBookInfo[];
  travelFormId?: string;
  agentId?: string;
}): TrainOrderBookDto {
  const { selection, passengers, travelFormId, agentId } = input;
  const trainEntity = buildTrainBookEntity(selection);

  const passengerDtos: TrainBookPassengerDto[] = passengers.map((info) => {
    const cred = info.credential;
    const clientId = resolveTrainInitClientId(info);
    const passengerTravelFormId =
      travelFormId ?? ("travelFormId" in info.passenger ? info.passenger.travelFormId : undefined);
    const passengerPolicy = buildTrainPassengerPolicy(info);

    return {
      ClientId: clientId,
      Train: { ...trainEntity },
      Credentials: buildTrainPassengerCredentials(info),
      Mobile: cred.Mobile,
      Policy: passengerPolicy,
      travelFormId: passengerTravelFormId,
    };
  });

  const dto: TrainOrderBookDto = {
    TravelFormId:
      travelFormId ?? passengerDtos.find((passenger) => passenger.travelFormId)?.travelFormId ?? "",
    Passengers: passengerDtos,
    Channel: TRAIN_BOOK_CHANNEL,
  };

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
  } = input;

  const trainEntityBase = buildTrainBookEntity(selection);
  const rules = selection.policy?.Rules?.filter(Boolean) ?? [];
  const illegalPolicy = rules.length ? rules.join(",") : undefined;

  const passengerDtos: TrainBookPassengerDto[] = passengers.map((info, index) => {
    const cred = info.credential;
    const clientId = resolveTrainInitClientId(info);
    const form = passengerForms?.[info.id];
    const contactForm = form as FlightPassengerBookForm | undefined;
    const mobile = contactForm
      ? resolvePassengerFormMobile(contactForm) || cred.Mobile
      : cred.Mobile;
    const email = contactForm ? resolvePassengerFormEmail(contactForm) : undefined;
    const seatPreference = bookSeatLocations?.[index]?.trim();
    const passengerPolicy = buildTrainPassengerPolicy(info);

    return {
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
      TravelType: resolveFlightTravelType(),
      travelFormId:
        travelFormId ??
        ("travelFormId" in info.passenger ? info.passenger.travelFormId : undefined),
      CostCenterCode: form?.costCenter.code || form?.otherCostCenterCode || undefined,
      CostCenterName: form?.costCenter.name || form?.otherCostCenterName || undefined,
      OrganizationName: form?.organization.name || form?.otherOrganizationName || undefined,
      OrganizationCode: form?.organization.code || undefined,
      OutNumbers:
        form?.outNumbers && Object.keys(form.outNumbers).length > 0 ? form.outNumbers : null,
    };
  });

  const dto: TrainOrderBookDto = {
    TravelFormId:
      travelFormId ?? passengerDtos.find((passenger) => passenger.travelFormId)?.travelFormId,
    Passengers: passengerDtos,
    Linkmans: buildAuthorizedLinkmans(authorizedContacts ?? []),
    Channel: TRAIN_BOOK_CHANNEL,
    TravelPayType: travelPayType,
    IsOfficialBooked: isOfficialBooked,
    AccountNumber: isOfficialBooked ? accountNumber12306 : undefined,
  };

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
    });
  }
  return map;
}

export function validateTrainBookForms(input: {
  passengers: PassengerBookInfo[];
  forms: Record<string, TrainPassengerBookForm>;
  outNumberFieldsByPassenger: Record<string, FlightOutNumberField[]>;
  authorizedContacts: FlightAuthorizedContact[];
  staffs?: FlightInitStaff[];
  requireIllegalReason: boolean;
}): string | null {
  const {
    passengers,
    forms,
    outNumberFieldsByPassenger,
    authorizedContacts,
    staffs,
    requireIllegalReason,
  } = input;

  for (const passenger of passengers) {
    const form = forms[passenger.id];
    if (!form) return "请完善旅客信息";

    const mobile = resolvePassengerFormMobile(form as FlightPassengerBookForm);
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

  const contactError = validateAuthorizedContacts(authorizedContacts);
  if (contactError) return contactError;

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

export function resolveTrainBookOrderId(response: { OrderId?: string } | undefined): string {
  return response?.OrderId?.trim() ?? "";
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
