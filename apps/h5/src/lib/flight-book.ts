import type {
  FlightAuthorizedContact,
  FlightBookPassengerDto,
  FlightBookPolicy,
  FlightInsuranceProduct,
  FlightOrderBookDto,
  FlightOutNumberField,
  FlightPassengerBookForm,
  FlightSegment,
  FlightTax,
  PassengerBookInfo,
} from "@ryx/shared-types";
import { credentialDisplayNumber } from "@ryx/shared-types";

import { resolveAppChannel } from "@/lib/app-channel";
import { buildAuthorizedLinkmans } from "@/lib/flight-book-contacts";
import {
  prepareBookFlightCabinDto,
  prepareInitFlightCabinDto,
  resolveFlightCabinCode,
  resolveInitFlightSegments,
  resolvePassengerTravelNumber,
  resolvePassengerTravelPolicy,
  syncSegmentWithFlightCabin,
} from "@/lib/flight-book-cabin";
import { mergeOutNumberValues } from "@/lib/flight-book-outnumber";
import { formatPolicyRules } from "@/lib/flight-book-policy";
import {
  resolvePassengerFormEmail,
  resolvePassengerFormMobile,
} from "@/lib/flight-book-passenger-form";
import type { FlightBookSelection } from "@/lib/flight-book-session";
import {
  isBusinessTravelMode,
  resolveFlightTravelType,
} from "@/lib/flight-travel-mode";
import { resolveTravelFormPassengerId } from "@/lib/flight-book-travel";
import type { HomeTravelMode } from "@/config/home-assets";

function normalizeFlightSegment(segment: FlightSegment): FlightSegment {
  const next = { ...segment };
  const flightNumber = next.Number ?? next.FlightNumber ?? "";
  if (flightNumber) {
    next.Number = flightNumber;
    next.FlightNumber = flightNumber;
  }
  return next;
}

function enrichFlightSegment(
  segment: FlightSegment,
  selection: FlightBookSelection,
): FlightSegment {
  const next = normalizeFlightSegment(segment);
  const query = selection.cabinsQuery;
  if (!next.DetailKey && query.detailKey) next.DetailKey = query.detailKey;
  if (!next.Data && query.detailKey) next.Data = query.detailKey;
  if (next.BookType == null && query.bookType) next.BookType = query.bookType;
  return next;
}

function mergeTravelNumberOutNumbers(
  outNumbers: Record<string, string> | null | undefined,
  travelNumber?: string,
): Record<string, string> | null {
  if (!outNumbers || !Object.keys(outNumbers).length) {
    if (!travelNumber) return null;
    return { TravelNumber: travelNumber };
  }
  if (outNumbers.TravelNumber?.trim()) {
    return outNumbers;
  }
  if (!travelNumber) return outNumbers;
  return { ...outNumbers, TravelNumber: travelNumber };
}

function resolvePassengerAccountId(info: PassengerBookInfo): string | undefined {
  return "AccountId" in info.passenger
    ? String(info.passenger.AccountId ?? "")
    : info.credential.AccountId;
}

function resolveCredentialAccount(info: PassengerBookInfo): { Id?: string } | undefined {
  return (info.credential as { Account?: { Id?: string } }).Account;
}

/** Initialize ClientId — aligned with proxy verify script (AccountId, not credential Id). */
export function resolveFlightInitClientId(info: PassengerBookInfo): string {
  const accountId = resolvePassengerAccountId(info);
  return String(accountId ?? info.credential.Id ?? info.id);
}

function resolveInitTravelFormId(value?: string): string | undefined {
  if (!value) return undefined;
  if (/^TF\d+$/i.test(value)) return undefined;
  return value;
}

function resolvePassengerFlightPolicyForBook(
  selection: FlightBookSelection,
  passenger: PassengerBookInfo,
  fallback?: FlightBookPolicy,
): FlightBookPolicy | undefined {
  return (
    selection.flightPoliciesByPassengerId?.[passenger.id] ??
    fallback ??
    selection.flightPolicy
  );
}

/** Legacy `fillBookPassengers` — spread vmCredential with Account/Policy normalization. */
export function buildSubmitCredentials(
  info: PassengerBookInfo,
  accountId: string,
): Record<string, unknown> {
  const cred = info.credential;
  const passengerPolicy = resolvePassengerTravelPolicy(info);
  const hideNumber =
    cred.HideNumber ??
    cred.HideCredentialsNumber ??
    credentialDisplayNumber(cred);
  const credType = cred.CredentialsType ?? cred.Type;

  return {
    ...cred,
    Type: credType,
    CredentialsType: credType,
    AccountId: accountId,
    Account: accountId ? { Id: accountId } : resolveCredentialAccount(info),
    ...(passengerPolicy ? { Policy: passengerPolicy } : {}),
    ...(cred.Name && hideNumber ? { CredentialsInfo: `${cred.Name}|${hideNumber}` } : {}),
    checked: true,
  };
}

/** Legacy submit uses passenger AccountId. */
export function resolveFlightSubmitClientId(info: PassengerBookInfo): string {
  return String(resolvePassengerAccountId(info) ?? info.id);
}

export interface FlightTicketNoticeRule {
  key: string;
  url: string;
}

/** Legacy `onTicketNeedKnow` — titles and URLs from Home-Detail `FlightRule`. */
export function resolveFlightTicketNoticeRules(
  detailSnapshot?: FlightBookSelection["detailSnapshot"],
): FlightTicketNoticeRule[] {
  const flightRule = detailSnapshot?.FlightRule;
  if (!flightRule) return [];
  return Object.entries(flightRule).map(([key, url]) => ({
    key,
    url: String(url),
  }));
}

/** Initialize payload — aligned with Legacy `initializeBookDto` and proxy verify script. */
export function buildFlightInitBookDto(input: {
  selection: FlightBookSelection;
  passengers: PassengerBookInfo[];
  travelFormId?: string;
  agentId?: string;
  travelMode?: HomeTravelMode;
  channel?: "tmc" | "tourist";
}): FlightOrderBookDto {
  const { selection, passengers, travelFormId, agentId, travelMode, channel } = input;
  const includeTravelForm = isBusinessTravelMode(travelMode);
  const policy = selection.flightPolicy;
  const flightCabin = prepareInitFlightCabinDto({
    flightPolicy: policy,
    fare: selection.fare,
    detailSnapshot: selection.detailSnapshot,
  });
  const resolvedCabin = resolveFlightCabinCode(flightCabin, selection.segment);
  const initSegments = resolveInitFlightSegments({ selection });

  const passengerDtos: FlightBookPassengerDto[] = passengers.map((info) => {
    const cred = info.credential;
    const clientId = resolveFlightInitClientId(info);
    const accountId = resolvePassengerAccountId(info) ?? info.id;
    const passengerPolicy = resolvePassengerTravelPolicy(info);

    const passengerTravelFormId = includeTravelForm
      ? resolveInitTravelFormId(
          travelFormId ??
            ("travelFormId" in info.passenger ? info.passenger.travelFormId : undefined),
        )
      : undefined;

    const passengerDto: FlightBookPassengerDto = {
      ClientId: clientId,
      FlightSegments: initSegments,
      FlightCabin: resolvedCabin,
      Credentials: {
        Id: cred.Id,
        Name: cred.Name,
        Mobile: cred.Mobile,
        Number: cred.Number,
        Type: cred.CredentialsType ?? cred.Type,
        CredentialsType: cred.CredentialsType ?? cred.Type,
        Account: accountId ? { Id: accountId } : resolveCredentialAccount(info),
      },
      Mobile: cred.Mobile,
      Policy: passengerPolicy,
    };

    if (includeTravelForm) {
      if (passengerTravelFormId) passengerDto.travelFormId = passengerTravelFormId;
      const passengerTravelNumber = resolvePassengerTravelNumber(info);
      if (passengerTravelNumber) passengerDto.travelNumber = passengerTravelNumber;
    }

    return passengerDto;
  });

  const resolvedTravelFormId = includeTravelForm
    ? resolveInitTravelFormId(
        travelFormId ?? passengerDtos.find((passenger) => passenger.travelFormId)?.travelFormId,
      )
    : undefined;

  const dto: FlightOrderBookDto = {
    Passengers: passengerDtos,
  };
  if (channel) {
    dto.channel = channel;
  }
  if (includeTravelForm && resolvedTravelFormId) {
    dto.TravelFormId = resolvedTravelFormId;
  }

  if (agentId) {
    dto.AgentId = agentId;
  }

  return dto;
}

export function buildFlightOrderBookDto(input: {
  selection: FlightBookSelection;
  passengers: PassengerBookInfo[];
  passengerForms?: Record<string, FlightPassengerBookForm>;
  travelFormId?: string;
  travelPayType?: number;
  messageLang?: string;
  authorizedContacts?: FlightAuthorizedContact[];
  agentId?: string;
  channel?: "tmc" | "tourist";
  isSave?: boolean;
  insurancesByPassenger?: Record<string, FlightInsuranceProduct[]>;
  outNumberFieldsByPassenger?: Record<string, FlightOutNumberField[]>;
  flightPolicy?: FlightBookPolicy;
  flightPoliciesByPassenger?: Record<string, FlightBookPolicy>;
  travelNumber?: string;
  travelType?: number;
  travelMode?: HomeTravelMode;
}): FlightOrderBookDto {
  const {
    selection,
    passengers,
    passengerForms,
    travelFormId,
    travelPayType,
    messageLang,
    authorizedContacts,
    agentId,
    channel,
    isSave,
    insurancesByPassenger,
    outNumberFieldsByPassenger,
    flightPolicy,
    flightPoliciesByPassenger,
    travelNumber,
    travelType,
    travelMode,
  } = input;
  const defaultPolicy = flightPolicy ?? selection.flightPolicy;
  const policiesByPassenger =
    flightPoliciesByPassenger ?? selection.flightPoliciesByPassengerId;
  const detailSnapshot = selection.detailSnapshot;
  const resolvedTravelType = travelType ?? resolveFlightTravelType(travelMode);
  const includeTravelForm = isBusinessTravelMode(travelMode);
  const sharedTravelNumber = includeTravelForm
    ? travelNumber ?? passengers.map(resolvePassengerTravelNumber).find(Boolean)
    : undefined;

  const passengerDtos: FlightBookPassengerDto[] = passengers.map((info) => {
    const cred = info.credential;
    const accountId = resolveFlightSubmitClientId(info);
    const form = passengerForms?.[info.id];
    const travelFormPassengerId = resolveTravelFormPassengerId(info, passengers);
    const travelForm = passengerForms?.[travelFormPassengerId] ?? form;
    const insuranceProducts = insurancesByPassenger?.[info.id] ?? [];
    const selectedInsurance = insuranceProducts.find(
      (item) => String(item.Id ?? "") === String(form?.selectedInsuranceId ?? ""),
    );

    const costCenterCode = form?.otherCostCenterCode || form?.costCenter.code || "";
    const costCenterName = form?.otherCostCenterName || form?.costCenter.name || "";
    const organizationName = form?.otherOrganizationName || form?.organization.name || "";
    const organizationCode = form?.otherOrganizationName ? "" : form?.organization.code || "";
    const outNumbers = includeTravelForm
      ? mergeTravelNumberOutNumbers(
          travelForm
            ? mergeOutNumberValues(
                travelForm,
                outNumberFieldsByPassenger?.[travelFormPassengerId] ?? [],
              )
            : null,
          sharedTravelNumber,
        )
      : null;

    const passengerPolicy =
      policiesByPassenger?.[info.id] ??
      resolvePassengerFlightPolicyForBook(selection, info, defaultPolicy);

    const resolvedCabin = prepareBookFlightCabinDto({
      flightPolicy: passengerPolicy,
      fare: selection.fare,
      detailSnapshot,
      insuranceProducts: selectedInsurance ? [selectedInsurance] : undefined,
      segment: selection.segment,
    });
    const segment = syncSegmentWithFlightCabin(
      enrichFlightSegment(selection.segment, selection),
      resolvedCabin,
    );

    const mobile = form ? resolvePassengerFormMobile(form) : cred.Mobile ?? "";
    const email = form ? resolvePassengerFormEmail(form) ?? "" : "";

    const passenger: FlightBookPassengerDto = {
      ClientId: accountId,
      ApprovalId: travelForm?.approvalId || "0",
      MessageLang: messageLang ?? "cn",
      CardName: "",
      CardNumber: "",
      TicketNum: "",
      FlightSegments: [segment],
      FlightCabin: resolvedCabin,
      Credentials: buildSubmitCredentials(info, accountId),
      Mobile: mobile,
      Email: email,
      IllegalPolicy: formatPolicyRules(passengerPolicy) || "",
      IllegalReason: (travelForm?.otherIllegalReason || travelForm?.illegalReason || "").trim(),
      IsSkipApprove: travelForm?.isSkipApprove ?? false,
      OutNumbers: outNumbers,
      InsuranceProducts: [],
      TravelType: resolvedTravelType,
      TravelPayType: 0,
      Policy: resolvePassengerTravelPolicy(info),
    };

    if (includeTravelForm) {
      const passengerTravelFormId =
        travelFormId ??
        ("travelFormId" in info.passenger ? info.passenger.travelFormId : undefined);
      if (passengerTravelFormId) passenger.travelFormId = passengerTravelFormId;
      const passengerTravelNumber = resolvePassengerTravelNumber(info);
      if (passengerTravelNumber) passenger.travelNumber = passengerTravelNumber;
    }

    if (costCenterCode) passenger.CostCenterCode = costCenterCode;
    if (costCenterName) passenger.CostCenterName = costCenterName;
    if (organizationName) passenger.OrganizationName = organizationName;
    if (form?.otherOrganizationName?.trim()) {
      passenger.OrganizationCode = "";
    } else if (organizationCode) {
      passenger.OrganizationCode = organizationCode;
    }
    if (travelForm?.expenseType) passenger.ExpenseType = travelForm.expenseType;

    return passenger;
  });

  const dto: FlightOrderBookDto = {
    Passengers: passengerDtos,
  };
  if (channel) {
    dto.channel = channel;
  }
  dto.Channel = resolveAppChannel();

  const resolvedTravelFormId =
    travelFormId ?? passengerDtos.find((passenger) => passenger.travelFormId)?.travelFormId;
  if (includeTravelForm && resolvedTravelFormId) {
    dto.TravelFormId = resolvedTravelFormId;
  }

  if (agentId) {
    dto.AgentId = agentId;
  }

  if (travelPayType != null) {
    dto.TravelPayType = travelPayType;
  }

  // Legacy bookFlight(isSave) — both flags mirror save vs submit, not API response.
  const saveOrder = Boolean(isSave);
  dto.IsFromOffline = saveOrder;
  dto.IsForbidAutoIssue = saveOrder;

  if (authorizedContacts?.length) {
    dto.Linkmans = buildAuthorizedLinkmans(authorizedContacts);
  }

  return dto;
}

export function resolveFlightBookOrderId(result: {
  TradeNo?: string;
  OrderId?: string;
}): string | undefined {
  const tradeNo = result.TradeNo;
  if (tradeNo && tradeNo !== "0") return tradeNo;
  return result.OrderId;
}

export interface FlightBookBillTaxLine {
  name: string;
  amount: number;
}

export interface FlightBookPassengerBill {
  passengerName: string;
  credentialNumber: string;
  fromCity: string;
  toCity: string;
  ticketPrice: number;
  flightRouteLabel: string;
  taxLines: FlightBookBillTaxLine[];
  serviceFee: number;
  subtotal: number;
}

export interface FlightBookBillBreakdown {
  passengers: FlightBookPassengerBill[];
  total: number;
}

function toAmount(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function resolveFlightFareTaxLines(fare: import("@ryx/shared-types").FlightFare): FlightBookBillTaxLine[] {
  const taxs =
    fare.FlightFareBasics?.flatMap((basic) => basic.FlightTaxs ?? []) ??
    ([] as FlightTax[]);
  if (taxs.length > 0) {
    return taxs.map((item) => ({
      name: item.Name ?? "税费",
      amount: toAmount(item.Tax),
    }));
  }

  const tax = toAmount(fare.Tax);
  return tax > 0 ? [{ name: "税费", amount: tax }] : [];
}

export function resolvePassengerServiceFee(
  passenger: PassengerBookInfo,
  serviceFees?: Record<string, number | string>,
): number {
  if (!serviceFees) return 0;
  const keys = [
    passenger.id,
    resolvePassengerAccountId(passenger),
    passenger.passenger.Id,
    passenger.credential.Id,
    passenger.credential.AccountId,
  ];
  for (const key of keys) {
    if (key != null && serviceFees[key] != null) {
      return toAmount(serviceFees[key]);
    }
  }
  return 0;
}

export function resolveFlightBookBillBreakdown(input: {
  selection: FlightBookSelection;
  passengers: PassengerBookInfo[];
  serviceFees?: Record<string, number | string>;
}): FlightBookBillBreakdown {
  const { selection, passengers, serviceFees } = input;
  const { segment, fare, cabinsQuery } = selection;
  const ticketPrice = toAmount(fare.SalesPrice ?? fare.TicketPrice);
  const taxLines = resolveFlightFareTaxLines(fare);
  const taxTotal = taxLines.reduce((sum, line) => sum + line.amount, 0);
  const fromCity = segment.FromCityName ?? cabinsQuery.fromName ?? "";
  const toCity = segment.ToCityName ?? cabinsQuery.toName ?? "";
  const flightNumber = segment.Number ?? segment.FlightNumber ?? cabinsQuery.flightNumber ?? "";
  const flightRouteLabel = `${flightNumber}${fromCity}--${toCity}`;

  const passengerBills = passengers.map((passenger) => {
    const serviceFee = resolvePassengerServiceFee(passenger, serviceFees);
    return {
      passengerName: passenger.credential.Name ?? passenger.passenger.Name ?? "",
      credentialNumber: credentialDisplayNumber(passenger.credential),
      fromCity,
      toCity,
      ticketPrice,
      flightRouteLabel,
      taxLines,
      serviceFee,
      subtotal: ticketPrice + taxTotal + serviceFee,
    };
  });

  return {
    passengers: passengerBills,
    total: passengerBills.reduce((sum, bill) => sum + bill.subtotal, 0),
  };
}

/** 底部合计：机票票价 + 税费 + Initialize 服务费（对齐 Legacy calcTotalPrice）。 */
export function resolveFlightBookDisplayAmount(
  selection: FlightBookSelection,
  passengers: PassengerBookInfo[],
  serviceFees?: Record<string, number | string>,
): number {
  if (passengers.length === 0) return 0;
  return resolveFlightBookBillBreakdown({ selection, passengers, serviceFees }).total;
}
