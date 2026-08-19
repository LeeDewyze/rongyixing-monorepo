import type { FlightSegment, PassengerBookInfo } from "@ryx/shared-types";

import type { FlightCabinsQuery } from "@/lib/flight-detail";
import { resolveFlightSegmentId, resolvePlaneTypeDescribe } from "@/utils/flight-list";

/** Legacy: refetch when returning after 2+ minutes. */
export const FLIGHT_LIST_STALE_MS = 2 * 60 * 1000;

/** Legacy: flight cabin prices remain valid for 10 minutes. */
export const FLIGHT_PRICE_STALE_MS = 10 * 60 * 1000;

/** Legacy: `pagePopTimeoutTime` — price may be stale after 10 minutes. */
export const FLIGHT_LIST_TIMEOUT_MS = FLIGHT_PRICE_STALE_MS;

export const FLIGHT_LIST_TIMEOUT_MESSAGE = "您的停留时间过长，价格信息可能发生变动，请重新查询";

export function passengerSelectionFingerprint(passengers: PassengerBookInfo[]): string {
  return passengers
    .map((p) => p.id)
    .sort()
    .join(",");
}

export function flightListRouteKey(params: {
  FromCode: string;
  ToCode: string;
  Date: string;
}): string {
  return `${params.FromCode}|${params.ToCode}|${params.Date}`;
}

export function isFlightListStale(lastUpdatedAt: number, now = Date.now()): boolean {
  return now - lastUpdatedAt >= FLIGHT_LIST_STALE_MS;
}

export function isFlightListTimedOut(lastUpdatedAt: number, now = Date.now()): boolean {
  return now - lastUpdatedAt >= FLIGHT_LIST_TIMEOUT_MS;
}

export function msUntilFlightListTimeout(lastUpdatedAt: number, now = Date.now()): number {
  return Math.max(0, FLIGHT_LIST_TIMEOUT_MS - (now - lastUpdatedAt));
}

export function getFlightListEmptyMessage(filtered: boolean): string {
  return filtered
    ? "未查到符合条件的航班信息，请更改查询条件重新查询"
    : "未查到航班信息，请更改查询条件重新查询";
}

/** Build cabins route query for Phase B `Home-Detail`. */
export function buildCabinsPath(segment: FlightSegment, searchParams: URLSearchParams): string {
  const params = new URLSearchParams(searchParams);
  const flightNumber = segment.Number || segment.FlightNumber || "";
  if (flightNumber) params.set("flightNumber", flightNumber);
  if (segment.FromAirport) params.set("fromAirport", segment.FromAirport);
  else if (searchParams.get("fromAirport"))
    params.set("fromAirport", searchParams.get("fromAirport")!);
  else if (searchParams.get("fromCode")) params.set("fromAirport", searchParams.get("fromCode")!);
  if (segment.ToAirport) params.set("toAirport", segment.ToAirport);
  else if (searchParams.get("toAirport")) params.set("toAirport", searchParams.get("toAirport")!);
  else if (searchParams.get("toCode")) params.set("toAirport", searchParams.get("toCode")!);
  if (segment.TakeoffTime) params.set("takeoffTime", segment.TakeoffTime);
  if (segment.ArrivalTime) params.set("arrivalTime", segment.ArrivalTime);
  if (segment.AirlineName) params.set("airlineName", segment.AirlineName);
  if (segment.AirlineSrc) params.set("airlineSrc", segment.AirlineSrc);
  if (segment.FlyTimeName) params.set("flyTimeName", segment.FlyTimeName);
  if (segment.FromAirportName) params.set("fromAirportName", segment.FromAirportName);
  if (segment.ToAirportName) params.set("toAirportName", segment.ToAirportName);
  if (segment.FromTerminal) params.set("fromTerminal", segment.FromTerminal);
  if (segment.ToTerminal) params.set("toTerminal", segment.ToTerminal);
  const planeTypeDescribe = resolvePlaneTypeDescribe(segment);
  if (planeTypeDescribe) params.set("planeTypeDescribe", planeTypeDescribe);
  if (segment.Meal) params.set("meal", segment.Meal);
  const detailKey = segment.DetailKey ?? segment.Data;
  if (detailKey) params.set("detailKey", detailKey);
  if (segment.BookType != null && segment.BookType !== "") {
    params.set("bookType", String(segment.BookType));
  }
  const routeId = resolveFlightSegmentId(segment);
  return `/flight/${encodeURIComponent(routeId)}/cabins?${params.toString()}`;
}

/** List route with `doRefresh=true` — Legacy timeout dialog confirm action. */
export function buildFlightListRefreshHref(
  query: Pick<
    FlightCabinsQuery,
    "date" | "fromCode" | "toCode" | "fromName" | "toName" | "fromAsAirport" | "toAsAirport"
  >,
): string {
  const params = new URLSearchParams();
  if (query.date) params.set("date", query.date);
  if (query.fromCode) params.set("fromCode", query.fromCode);
  if (query.toCode) params.set("toCode", query.toCode);
  if (query.fromName) params.set("fromName", query.fromName);
  if (query.toName) params.set("toName", query.toName);
  if (query.fromAsAirport) params.set("fromAsAirport", "true");
  if (query.toAsAirport) params.set("toAsAirport", "true");
  params.set("doRefresh", "true");
  return `/flight/list?${params.toString()}`;
}
