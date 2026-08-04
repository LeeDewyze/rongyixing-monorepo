import type {
  FlightDetailResult,
  FlightPolicyPassengerResult,
  FlightSearchParams,
  FlightSegment,
  PassengerBookInfo,
} from "@ryx/shared-types";
import { resolveExchangeDetailFromListSnapshot } from "@ryx/api";

import { getApi } from "@/lib/api";
import { buildFlightPolicyParams } from "@/lib/flight-book-policy";
import {
  buildFlightDetailParams,
  normalizeFlightDetailData,
  segmentFromCabinsQuery,
  type FlightCabinsQuery,
} from "@/lib/flight-detail";
import type { FlightExchangeSession } from "@/lib/flight-exchange-session";
import { loadFlightListSnapshot } from "@/lib/flight-list-session";
import { buildFlightPolicySessionKey, saveFlightPolicySession } from "@/lib/flight-policy-session";
import { resolveFlightSegmentId } from "@/utils/flight-list";

export function buildCabinsQueryFromSegment(
  segment: FlightSegment,
  searchParams: URLSearchParams,
): FlightCabinsQuery {
  const flightNumber = segment.Number || segment.FlightNumber || "";
  const detailKey = segment.DetailKey ?? segment.Data ?? "";
  return {
    date: searchParams.get("date") ?? segment.TakeoffTime?.slice(0, 10) ?? "",
    channel: (searchParams.get("channel") as FlightCabinsQuery["channel"]) ?? undefined,
    fromCode: searchParams.get("fromCode") ?? "",
    toCode: searchParams.get("toCode") ?? "",
    fromName: searchParams.get("fromName") ?? segment.FromCityName ?? "",
    toName: searchParams.get("toName") ?? segment.ToCityName ?? "",
    fromAsAirport: searchParams.get("fromAsAirport") === "true",
    toAsAirport: searchParams.get("toAsAirport") === "true",
    flightNumber,
    fromAirport: segment.FromAirport ?? searchParams.get("fromCode") ?? "",
    toAirport: segment.ToAirport ?? searchParams.get("toCode") ?? "",
    takeoffTime: segment.TakeoffTime ?? "",
    arrivalTime: segment.ArrivalTime ?? "",
    detailKey: detailKey ? String(detailKey) : "",
    bookType:
      segment.BookType != null && segment.BookType !== ""
        ? String(segment.BookType)
        : (searchParams.get("bookType") ?? ""),
    airlineName: segment.AirlineName ?? "",
    flyTimeName: segment.FlyTimeName ?? "",
    fromAirportName: segment.FromAirportName ?? "",
    toAirportName: segment.ToAirportName ?? "",
    fromTerminal: segment.FromTerminal ?? "",
    toTerminal: segment.ToTerminal ?? "",
    planeTypeDescribe: segment.PlaneTypeDescribe ?? "",
    meal: segment.Meal ?? "",
    airlineSrc: segment.AirlineSrc ?? "",
    ticketId: searchParams.get("ticketId") ?? "",
    exchange: searchParams.get("exchange") ?? undefined,
  };
}

export function resolveFlightExchangePrefetchOptions(
  searchParams: URLSearchParams,
): { ticketId: string; isExchange: true } | undefined {
  const ticketId = searchParams.get("ticketId")?.trim() ?? "";
  if (searchParams.get("exchange") !== "1" || !ticketId) return undefined;
  return { ticketId, isExchange: true };
}

export function resolveFlightCabinsPassengers(input: {
  isExchangeBook: boolean;
  exchangeSession: FlightExchangeSession | null;
  passengers: PassengerBookInfo[];
}): PassengerBookInfo[] {
  if (input.isExchangeBook && input.exchangeSession?.passengers?.length) {
    return input.exchangeSession.passengers;
  }
  return input.passengers;
}

/** Prefer API detail, then list prefetch cache, then exchange list snapshot. */
export function resolveFlightCabinsDetailSnapshot(input: {
  query: FlightCabinsQuery;
  rawDetail?: FlightDetailResult;
  cachedDetail?: FlightDetailResult;
  isExchangeBook: boolean;
  listParams: FlightSearchParams;
}): FlightDetailResult {
  const flightNumber = input.query.flightNumber;
  const normalizeOpts = {
    isExchange: input.isExchangeBook,
    flightNumber,
  };

  const fromApi = input.rawDetail
    ? normalizeFlightDetailData(input.rawDetail, normalizeOpts)
    : undefined;
  if (fromApi?.FlightFares?.length) return fromApi;

  const fromCache = input.cachedDetail
    ? normalizeFlightDetailData(input.cachedDetail, normalizeOpts)
    : undefined;
  if (fromCache?.FlightFares?.length) return fromCache;

  if (input.isExchangeBook) {
    const listSnapshot = loadFlightListSnapshot(input.listParams);
    const segment = segmentFromCabinsQuery(input.query);
    const fromList = listSnapshot
      ? resolveExchangeDetailFromListSnapshot(listSnapshot, segment)
      : null;
    if (fromList?.FlightFares?.length) {
      return normalizeFlightDetailData(fromList, normalizeOpts) ?? fromList;
    }
  }

  return fromApi ?? fromCache ?? {};
}

export interface PrefetchFlightCabinsPolicyResult {
  detail: FlightDetailResult;
  policyResults: FlightPolicyPassengerResult[];
}

/** Legacy `checkCabinsAndPolicy` — Detail then Policy before cabins navigation. */
export async function prefetchFlightCabinsPolicy(input: {
  segment: FlightSegment;
  listParams: FlightSearchParams;
  searchParams: URLSearchParams;
  passengers: PassengerBookInfo[];
  fetchPolicy?: boolean;
}): Promise<PrefetchFlightCabinsPolicyResult> {
  const { segment, listParams, searchParams, passengers, fetchPolicy = true } = input;
  const query = buildCabinsQueryFromSegment(segment, searchParams);
  const exchangeOptions = resolveFlightExchangePrefetchOptions(searchParams);
  const flightNumber = query.flightNumber;
  const listSnapshot = loadFlightListSnapshot(listParams);

  let detail: FlightDetailResult | undefined;
  const lowestFare = Number(segment.LowestFare);
  if (exchangeOptions && Number.isFinite(lowestFare) && lowestFare >= 0 && listSnapshot) {
    detail = resolveExchangeDetailFromListSnapshot(listSnapshot, segment) ?? undefined;
  }

  if (!detail?.FlightFares?.length) {
    const detailParams = buildFlightDetailParams(query, passengers.length, exchangeOptions);
    if (!detailParams) {
      throw new Error("Incomplete flight detail parameters");
    }

    const api = getApi();
    const rawDetail = await api.flight.getFlightDetail(detailParams);
    detail = normalizeFlightDetailData(rawDetail, {
      isExchange: Boolean(exchangeOptions),
      flightNumber,
    });
  }

  if (!detail?.FlightFares?.length) {
    throw new Error("No cabins available for this flight");
  }

  const policyParams = buildFlightPolicyParams({
    listSnapshot: listSnapshot ?? undefined,
    detailSnapshot: detail,
    passengers,
  });

  let policyResults: FlightPolicyPassengerResult[] = [];
  if (fetchPolicy && policyParams) {
    policyResults = await getApi().flight.getFlightPolicy(policyParams);
  }

  saveFlightPolicySession(
    buildFlightPolicySessionKey({
      segmentId: resolveFlightSegmentId(segment),
      flightNumber,
      listParams,
      passengers,
    }),
    policyResults,
    detail,
  );

  return { detail, policyResults };
}
