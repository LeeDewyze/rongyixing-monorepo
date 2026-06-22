import {
  applyLegacyInitDetailResult,
  normalizeFlightDetailResponse,
  resolveCheckedBaggage,
  selectCabinsForSegment,
} from "@ryx/api";
import type {
  FlightCabinTab,
  FlightDetailParams,
  FlightDetailResult,
  FlightFare,
  FlightFareBasic,
  FlightFareVariables,
  FlightSegment,
} from "@ryx/shared-types";

/** Legacy FlightCabinType.Y | SeniorY */
const ECONOMY_CABIN_TYPES = new Set([1, 8]);

export interface FlightCabinsQuery {
  date: string;
  fromCode: string;
  toCode: string;
  fromName: string;
  toName: string;
  fromAsAirport: boolean;
  toAsAirport: boolean;
  flightNumber: string;
  fromAirport: string;
  toAirport: string;
  takeoffTime: string;
  arrivalTime: string;
  detailKey: string;
  bookType: string;
  airlineName: string;
  flyTimeName: string;
  fromAirportName: string;
  toAirportName: string;
  fromTerminal: string;
  toTerminal: string;
  planeTypeDescribe: string;
  meal: string;
  airlineSrc: string;
}

export function parseFlightCabinsQuery(
  searchParams: URLSearchParams,
): FlightCabinsQuery {
  return {
    date: searchParams.get("date") ?? "",
    fromCode: searchParams.get("fromCode") ?? "",
    toCode: searchParams.get("toCode") ?? "",
    fromName: searchParams.get("fromName") ?? "",
    toName: searchParams.get("toName") ?? "",
    fromAsAirport: searchParams.get("fromAsAirport") === "true",
    toAsAirport: searchParams.get("toAsAirport") === "true",
    flightNumber: searchParams.get("flightNumber") ?? "",
    fromAirport: searchParams.get("fromAirport") ?? "",
    toAirport: searchParams.get("toAirport") ?? "",
    takeoffTime: searchParams.get("takeoffTime") ?? "",
    arrivalTime: searchParams.get("arrivalTime") ?? "",
    detailKey: searchParams.get("detailKey") ?? "",
    bookType: searchParams.get("bookType") ?? "",
    airlineName: searchParams.get("airlineName") ?? "",
    flyTimeName: searchParams.get("flyTimeName") ?? "",
    fromAirportName: searchParams.get("fromAirportName") ?? "",
    toAirportName: searchParams.get("toAirportName") ?? "",
    fromTerminal: searchParams.get("fromTerminal") ?? "",
    toTerminal: searchParams.get("toTerminal") ?? "",
    planeTypeDescribe: searchParams.get("planeTypeDescribe") ?? "",
    meal: searchParams.get("meal") ?? "",
    airlineSrc: searchParams.get("airlineSrc") ?? "",
  };
}

export function buildFlightDetailParams(
  query: FlightCabinsQuery,
  passengerCount: number,
): FlightDetailParams | null {
  const date = query.takeoffTime.slice(0, 10) || query.date;
  const fromAirport = query.fromAirport || query.fromCode;
  const toAirport = query.toAirport || query.toCode;
  if (!date || !fromAirport || !toAirport || !query.flightNumber) {
    return null;
  }
  const adtPtcs = Math.min(Math.max(passengerCount || 1, 1), 9);
  const params: FlightDetailParams = {
    Date: date,
    FromCode: fromAirport,
    ToCode: toAirport,
    FlightNumber: query.flightNumber,
    FromAsAirport: query.fromAsAirport,
    ToAsAirport: query.toAsAirport,
    ADTPtcs: adtPtcs,
    DetailKey: query.detailKey,
    Lang: "cn",
  };
  if (query.bookType) {
    params.BookType = query.bookType;
  }
  return params;
}

export function segmentFromCabinsQuery(query: FlightCabinsQuery): FlightSegment {
  return {
    Id: query.detailKey || query.flightNumber,
    Number: query.flightNumber,
    FlightNumber: query.flightNumber,
    AirlineName: query.airlineName,
    AirlineSrc: query.airlineSrc,
    FromAirport: query.fromAirport,
    FromAirportName: query.fromAirportName,
    FromCityName: query.fromName,
    FromTerminal: query.fromTerminal,
    ToAirport: query.toAirport,
    ToAirportName: query.toAirportName,
    ToCityName: query.toName,
    ToTerminal: query.toTerminal,
    TakeoffTime: query.takeoffTime,
    ArrivalTime: query.arrivalTime,
    FlyTimeName: query.flyTimeName,
    PlaneTypeDescribe: query.planeTypeDescribe,
    Meal: query.meal,
  };
}

export function resolveDetailSegment(
  query: FlightCabinsQuery,
  detailSegment: FlightSegment | undefined,
): FlightSegment {
  if (detailSegment) {
    return {
      ...segmentFromCabinsQuery(query),
      ...detailSegment,
      Number: detailSegment.Number || query.flightNumber,
      FlightNumber: detailSegment.FlightNumber || query.flightNumber,
    };
  }
  return segmentFromCabinsQuery(query);
}

export function normalizeFlightDetailData(result: FlightDetailResult | undefined): FlightDetailResult {
  if (!result) return {};
  return normalizeFlightDetailResponse(result);
}

export function prepareFlightFareForDisplay(fare: FlightFare): FlightFare {
  return applyLegacyInitDetailResult(fare);
}

export function filterFaresForFlight(
  fares: FlightFare[] | undefined,
  flightNumber: string,
): FlightFare[] {
  if (!fares?.length) return [];
  if (!flightNumber) return fares.map(prepareFlightFareForDisplay);
  return selectCabinsForSegment({ FlightFares: fares }, flightNumber);
}

export function normalizeFlightFare(fare: FlightFare): FlightFare {
  return prepareFlightFareForDisplay(fare);
}

export function isEconomyFare(fare: FlightFare): boolean {
  const cabin = prepareFlightFareForDisplay(fare);
  const basics = cabin.FlightFareBasics;
  if (!basics?.length) {
    const cabinType = Number(cabin.Type);
    return !cabinType || ECONOMY_CABIN_TYPES.has(cabinType);
  }
  return basics.every((basic) => {
    const cabinType = Number(basic.CabinType ?? cabin.Type);
    return !cabinType || ECONOMY_CABIN_TYPES.has(cabinType);
  });
}

export function partitionCabinsByTab(fares: FlightFare[]): Record<FlightCabinTab, FlightFare[]> {
  const economy: FlightFare[] = [];
  const business: FlightFare[] = [];
  for (const fare of fares) {
    if (isEconomyFare(fare)) {
      economy.push(fare);
    } else {
      business.push(fare);
    }
  }
  const byPrice = (a: FlightFare, b: FlightFare) =>
    Number(a.SalesPrice ?? 0) - Number(b.SalesPrice ?? 0);
  economy.sort(byPrice);
  business.sort(byPrice);
  return { economy, business };
}

/** Legacy `discount` pipe. */
export function formatCabinDiscount(discount: number | string | undefined): string {
  const value = Number(discount);
  if (!Number.isFinite(value) || value <= 0) return "";
  if (value >= 1) return "全价";
  const d = ((value * 100) / 10).toFixed(1);
  const normalized = d.includes(".0") ? d.replace(".0", "") : d;
  return `${normalized}折`;
}

export function formatFareSalesPrice(price: string | number | undefined): string {
  const value = Number(price);
  if (!Number.isFinite(value)) return price != null && price !== "" ? String(price) : "-";
  return String(Math.round(value));
}

function formatBasicName(basic: FlightFareBasic): string {
  return basic.CabinTypeAttach || basic.CabinTypeName || "";
}

function resolveBasicDiscount(basic: FlightFareBasic, fare: FlightFare): string {
  return formatCabinDiscount(basic.Discount ?? fare.Discount);
}

/**
 * Legacy `tmc-flight-item-cabins_ryx` template:
 * codes with `+` / trailing `/`, then names + `discount` pipe per basic.
 */
export function formatCabinInfoLine(fare: FlightFare): string {
  const cabin = prepareFlightFareForDisplay(fare);
  const basics = cabin.FlightFareBasics ?? [];
  if (!basics.length) return cabin.TypeName || cabin.Code || "舱位";

  let line = "";
  for (let index = 0; index < basics.length; index += 1) {
    line += basics[index]?.CabinCode ?? "";
    if (index < basics.length - 1) line += "+";
    else line += "/";
  }
  for (let index = 0; index < basics.length; index += 1) {
    const basic = basics[index]!;
    line += formatBasicName(basic);
    line += resolveBasicDiscount(basic, cabin);
    if (index < basics.length - 1) line += "+";
  }
  return line;
}

export function formatCabinLabel(fare: FlightFare): string {
  return formatCabinInfoLine(fare);
}

/** Legacy template: `cabin.Cabin?.Count && cabin.Cabin?.Count < "10"`. */
export function shouldShowFareRemainCount(fare: FlightFare): boolean {
  const count = prepareFlightFareForDisplay(fare).Count;
  if (count == null || count === "" || count === 0) return false;
  return Number(count) < 10;
}

/** Legacy list row: `cabin.Cabin?.Variables?.Baggage` (after initDetailResult). */
export function fareBaggageText(fare: FlightFare): string | undefined {
  const cabin = prepareFlightFareForDisplay(fare);
  const variables =
    cabin.Variables && typeof cabin.Variables === "object"
      ? (cabin.Variables as FlightFareVariables)
      : cabin.VariablesObj;
  const baggage = variables?.Baggage;
  if (typeof baggage === "string" && baggage.trim()) return baggage.trim();
  return resolveCheckedBaggage(cabin);
}

export function fareRemainCount(fare: FlightFare): number | null {
  const count = Number(prepareFlightFareForDisplay(fare).Count);
  if (!Number.isFinite(count) || count <= 0) return null;
  return count;
}

export interface FlightFareRuleSheetRow {
  Tag?: string;
  Name?: string;
  Description?: string;
  Details?: Array<{ name: string; value: unknown }>;
}

/** Legacy `TicketChangingComponent`: dedupe `Tag`, show rules + VariablesObj.Details. */
export function prepareFlightFareRulesForSheet(fare: FlightFare): FlightFareRuleSheetRow[] {
  const cabin = prepareFlightFareForDisplay(fare);
  const seenTags = new Set<string>();

  return (cabin.FlightFareRules ?? []).map((rule) => {
    let tag = rule.Tag?.trim() ?? "";
    if (tag) {
      if (seenTags.has(tag)) tag = "";
      else seenTags.add(tag);
    }

    const details = rule.VariablesObj?.Details?.filter(
      (item): item is { name: string; value: unknown } =>
        Boolean(item && typeof item === "object" && "name" in item),
    );

    return {
      Tag: tag || undefined,
      Name: rule.Name?.trim() || undefined,
      Description: rule.Description?.trim() || undefined,
      Details: details?.length ? details : undefined,
    };
  });
}

export { applyLegacyInitDetailResult, normalizeFlightDetailResponse, resolveCheckedBaggage } from "@ryx/api";
