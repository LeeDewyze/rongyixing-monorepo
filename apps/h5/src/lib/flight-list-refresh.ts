import type { FlightSegment, PassengerBookInfo } from "@ryx/shared-types";

/** Legacy: refetch when returning after 2+ minutes. */
export const FLIGHT_LIST_STALE_MS = 2 * 60 * 1000;

/** Legacy: `pagePopTimeoutTime` — price may be stale after 10 minutes. */
export const FLIGHT_LIST_TIMEOUT_MS = 10 * 60 * 1000;

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
  if (segment.ToAirport) params.set("toAirport", segment.ToAirport);
  if (segment.TakeoffTime) params.set("takeoffTime", segment.TakeoffTime);
  if (segment.ArrivalTime) params.set("arrivalTime", segment.ArrivalTime);
  if (segment.AirlineName) params.set("airlineName", segment.AirlineName);
  if (segment.AirlineSrc) params.set("airlineSrc", segment.AirlineSrc);
  if (segment.FlyTimeName) params.set("flyTimeName", segment.FlyTimeName);
  if (segment.FromAirportName) params.set("fromAirportName", segment.FromAirportName);
  if (segment.ToAirportName) params.set("toAirportName", segment.ToAirportName);
  if (segment.FromTerminal) params.set("fromTerminal", segment.FromTerminal);
  if (segment.ToTerminal) params.set("toTerminal", segment.ToTerminal);
  if (segment.PlaneTypeDescribe) params.set("planeTypeDescribe", segment.PlaneTypeDescribe);
  if (segment.Meal) params.set("meal", segment.Meal);
  const detailKey = segment.DetailKey ?? segment.Data;
  if (detailKey) params.set("detailKey", detailKey);
  if (segment.BookType != null && segment.BookType !== "") {
    params.set("bookType", String(segment.BookType));
  }
  return `/flight/${encodeURIComponent(segment.Id)}/cabins?${params.toString()}`;
}
