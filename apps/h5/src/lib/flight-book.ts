import type {
  FlightAuthorizedContact,
  FlightBookPassengerDto,
  FlightFare,
  FlightOrderBookDto,
  FlightPassengerBookForm,
  FlightTax,
  PassengerBookInfo,
} from "@ryx/shared-types";
import { credentialDisplayNumber } from "@ryx/shared-types";

import { buildAuthorizedLinkmans } from "@/lib/flight-book-contacts";
import {
  resolvePassengerFormEmail,
  resolvePassengerFormMobile,
} from "@/lib/flight-book-passenger-form";
import type { FlightBookSelection } from "@/lib/flight-book-session";

function buildCabinRules(fare: FlightFare): Record<string, string> | undefined {
  const rules = fare.FlightFareRules;
  if (!rules?.length) return undefined;
  const map: Record<string, string> = {};
  for (const rule of rules) {
    const key = `${rule.Tag ?? rule.Name ?? "rule"}-${Object.keys(map).length}`;
    map[key] = rule.Description ?? rule.Name ?? "";
  }
  return map;
}

function prepareFlightCabin(fare: FlightFare): FlightFare & { Rules?: Record<string, string> } {
  const rules = buildCabinRules(fare);
  return rules ? { ...fare, Rules: rules } : { ...fare };
}

export function buildFlightOrderBookDto(input: {
  selection: FlightBookSelection;
  passengers: PassengerBookInfo[];
  passengerForms?: Record<string, FlightPassengerBookForm>;
  travelFormId?: string;
  travelPayType?: number;
  messageLang?: string;
  authorizedContacts?: FlightAuthorizedContact[];
  linkman?: { name: string; mobile: string; messageLang?: string };
}): FlightOrderBookDto {
  const {
    selection,
    passengers,
    passengerForms,
    travelFormId,
    travelPayType,
    messageLang,
    authorizedContacts,
    linkman,
  } = input;
  const segment = { ...selection.segment };
  const flightCabin = prepareFlightCabin(selection.fare);

  const passengerDtos: FlightBookPassengerDto[] = passengers.map((info) => {
    const cred = info.credential;
    const accountId = info.passenger.AccountId ?? info.id;
    const form = passengerForms?.[info.id];

    const mobile = form ? resolvePassengerFormMobile(form) : cred.Mobile;
    const email = form ? resolvePassengerFormEmail(form) : undefined;
    const costCenterCode = form?.otherCostCenterCode || form?.costCenter.code || "";
    const costCenterName = form?.otherCostCenterName || form?.costCenter.name || "";
    const organizationName = form?.otherOrganizationName || form?.organization.name || "";
    const organizationCode = form?.otherOrganizationName ? "" : form?.organization.code || "";

    return {
      ClientId: accountId,
      FlightSegments: [segment],
      FlightCabin: flightCabin,
      Credentials: {
        Id: cred.Id,
        Name: cred.Name,
        Mobile: cred.Mobile,
        Number: cred.Number,
        Type: cred.CredentialsType ?? cred.Type,
        CredentialsType: cred.CredentialsType ?? cred.Type,
        Account: accountId ? { Id: accountId } : undefined,
      },
      Mobile: mobile,
      Email: email,
      CostCenterCode: costCenterCode,
      CostCenterName: costCenterName,
      OrganizationName: organizationName,
      OrganizationCode: organizationCode,
      TravelPayType: travelPayType,
      MessageLang: messageLang,
      travelFormId:
        travelFormId ??
        ("travelFormId" in info.passenger ? info.passenger.travelFormId : undefined),
    };
  });

  const dto: FlightOrderBookDto = {
    TravelFormId: travelFormId,
    Passengers: passengerDtos,
    TravelPayType: travelPayType,
  };

  if (authorizedContacts?.length) {
    dto.Linkmans = buildAuthorizedLinkmans(authorizedContacts);
  } else if (linkman?.name && linkman.mobile) {
    dto.Linkmans = [
      {
        Name: linkman.name,
        Mobile: linkman.mobile,
        MessageLang: linkman.messageLang ?? messageLang,
      },
    ];
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

export function resolveFlightFareTaxLines(fare: FlightFare): FlightBookBillTaxLine[] {
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
    passenger.passenger.AccountId,
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
