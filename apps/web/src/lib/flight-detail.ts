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

import { parseFlightTimestamp } from "@/utils/flight-list";
import {
  formatFlightLegDateTip,
  formatFlightLocationLabel,
  formatFlightMealLabel,
  formatFlightMetaDuration,
} from "@/utils/flight-list-display";

/** Legacy FlightCabinType.Y | SeniorY */
const ECONOMY_CABIN_TYPES = new Set([1, 8]);

export interface FlightCabinsQuery {
  date: string;
  channel?: "tmc" | "tourist";
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
  ticketId?: string;
  exchange?: string;
}

export function parseFlightCabinsQuery(searchParams: URLSearchParams): FlightCabinsQuery {
  return {
    date: searchParams.get("date") ?? "",
    channel: (searchParams.get("channel") as FlightCabinsQuery["channel"]) ?? undefined,
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
    ticketId: searchParams.get("ticketId") ?? "",
    exchange: searchParams.get("exchange") ?? undefined,
  };
}

export function buildFlightDetailParams(
  query: FlightCabinsQuery,
  passengerCount: number,
  options?: { ticketId?: string; isExchange?: boolean },
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
    channel: query.channel,
  };
  if (query.bookType) {
    params.BookType = query.bookType;
  }
  const exchangeTicketId = options?.ticketId ?? query.ticketId;
  if (exchangeTicketId) {
    params.TicketId = exchangeTicketId;
    params.IsExchange = options?.isExchange ?? query.exchange === "1";
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

/** List/query route labels — must win over detail leg[0] for transfer flights. */
const ROUTE_DISPLAY_FIELDS = [
  "FromCityName",
  "ToCityName",
  "FromAirportName",
  "ToAirportName",
  "FromTerminal",
  "ToTerminal",
  "FromAirport",
  "ToAirport",
  "TakeoffTime",
  "ArrivalTime",
  "FlyTimeName",
  "AirlineName",
  "AirlineSrc",
  "PlaneTypeDescribe",
  "Meal",
] as const satisfies ReadonlyArray<keyof FlightSegment>;

function preferQueryRouteDisplay(
  querySegment: FlightSegment,
  detailSegment: FlightSegment,
): FlightSegment {
  const merged: FlightSegment = { ...detailSegment };
  for (const key of ROUTE_DISPLAY_FIELDS) {
    const queryValue = querySegment[key];
    if (queryValue != null && queryValue !== "") {
      merged[key] = queryValue as never;
    }
  }
  return merged;
}

export function resolveDetailSegment(
  query: FlightCabinsQuery,
  detailSegment: FlightSegment | undefined,
): FlightSegment {
  const fromQuery = segmentFromCabinsQuery(query);
  if (!detailSegment) {
    return fromQuery;
  }
  const merged = preferQueryRouteDisplay(fromQuery, detailSegment);
  return {
    ...merged,
    Number: detailSegment.Number || query.flightNumber,
    FlightNumber: detailSegment.FlightNumber || query.flightNumber,
    IsTransfer: merged.IsTransfer ?? detailSegment.IsTransfer,
  };
}

export interface FlightTransferLayover {
  cityLabel: string;
  airportLabel: string;
  waitDurationLabel?: string;
}

export interface FlightTransferLegView {
  segment: FlightSegment;
  fromLabel: string;
  toLabel: string;
  durationLabel?: string;
  flightNo: string;
  departureDayTip?: string;
  arrivalDayTip?: string;
  planeLabel: string;
  mealLabel?: string;
}

export interface FlightTransferItinerary {
  legs: FlightTransferLegView[];
  layovers: FlightTransferLayover[];
}

export function formatFlightTransferLayoverSummary(layovers: FlightTransferLayover[]): {
  waitDurationLabel?: string;
  routeMiddleLabel?: string;
} {
  if (!layovers.length) return {};

  const cityLabels = layovers
    .map((layover) => layover.cityLabel.trim())
    .filter((value): value is string => Boolean(value));
  const waitDurationLabels = layovers
    .map((layover) => layover.waitDurationLabel?.trim())
    .filter((value): value is string => Boolean(value));

  return {
    routeMiddleLabel: cityLabels.length ? `中转 · ${cityLabels.join(" / ")}` : "中转",
    waitDurationLabel: waitDurationLabels.length ? waitDurationLabels.join(" / ") : undefined,
  };
}

function formatLayoverDuration(
  arrivalTime: string | undefined,
  nextTakeoffTime: string | undefined,
): string | undefined {
  const arrival = parseFlightTimestamp(arrivalTime);
  const depart = parseFlightTimestamp(nextTakeoffTime);
  if (!arrival || !depart || depart <= arrival) return undefined;

  const totalMinutes = Math.round((depart - arrival) / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours}h${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

function resolveTransferCityLabel(segment: FlightSegment): string | undefined {
  const transfer = segment.Transfer;
  if (transfer && typeof transfer === "object") {
    const city =
      transfer.CityName ?? transfer.TransferCityName ?? transfer.City ?? transfer.AirportCityName;
    if (city?.trim()) return city.trim();
  }
  return segment.ToCityName?.trim() || segment.FromCityName?.trim() || undefined;
}

/** Build cabins-page transfer itinerary from Home-Detail `FlightSegments`. */
export function buildFlightTransferItinerary(
  segments: FlightSegment[] | undefined,
): FlightTransferItinerary | null {
  if (!segments || segments.length < 2) return null;

  const tripBaseDate = segments[0]?.TakeoffTime?.slice(0, 10);

  const legs: FlightTransferLegView[] = segments.map((segment) => {
    const flightNo = (segment.Number ?? segment.FlightNumber ?? "").trim();
    const planeLabel = segment.PlaneTypeDescribe || segment.PlaneType || "";
    const mealLabel = formatFlightMealLabel(segment.Meal);
    const legTakeoffDate = segment.TakeoffTime?.slice(0, 10);

    return {
      segment,
      fromLabel: formatFlightLocationLabel(
        segment.FromCityName,
        segment.FromAirportName,
        segment.FromTerminal,
      ),
      toLabel: formatFlightLocationLabel(
        segment.ToCityName,
        segment.ToAirportName,
        segment.ToTerminal,
      ),
      durationLabel: formatFlightMetaDuration(segment.FlyTimeName ?? segment.Duration),
      flightNo,
      departureDayTip: formatFlightLegDateTip(segment.TakeoffTime, tripBaseDate),
      arrivalDayTip: formatFlightLegDateTip(segment.ArrivalTime, legTakeoffDate),
      planeLabel,
      mealLabel,
    };
  });

  const layovers: FlightTransferLayover[] = [];
  for (let index = 0; index < segments.length - 1; index += 1) {
    const current = segments[index]!;
    const next = segments[index + 1]!;
    const city =
      resolveTransferCityLabel(current) ??
      resolveTransferCityLabel(next) ??
      current.ToCityName ??
      next.FromCityName ??
      "中转";
    const transferTime = current.Transfer?.TransferTime?.trim();
    layovers.push({
      cityLabel: city,
      airportLabel: formatFlightLocationLabel(
        current.ToCityName,
        current.ToAirportName,
        current.ToTerminal,
      ),
      waitDurationLabel:
        transferTime || formatLayoverDuration(current.ArrivalTime, next.TakeoffTime),
    });
  }

  return { legs, layovers };
}

export function normalizeFlightDetailData(
  result: FlightDetailResult | undefined,
): FlightDetailResult {
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

/** Legacy gates booking via policy `IsAllowBook` (C1-full). Phase C: only block sold-out fares. */
export function isFlightFareBookable(fare: FlightFare): boolean {
  const count = prepareFlightFareForDisplay(fare).Count;
  if (count != null && count !== "" && Number(count) === 0) return false;
  return true;
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

    const rawDetails = rule.VariablesObj?.Details;
    const details = Array.isArray(rawDetails)
      ? rawDetails.filter((item): item is { name: string; value: unknown } =>
          Boolean(item && typeof item === "object" && "name" in item),
        )
      : undefined;

    return {
      Tag: tag || undefined,
      Name: rule.Name?.trim() || undefined,
      Description: rule.Description?.trim() || undefined,
      Details: details?.length ? details : undefined,
    };
  });
}

export {
  applyLegacyInitDetailResult,
  normalizeFlightDetailResponse,
  resolveCheckedBaggage,
} from "@ryx/api";
