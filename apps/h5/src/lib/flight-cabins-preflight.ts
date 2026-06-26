import type {
  FlightDetailResult,
  FlightPolicyPassengerResult,
  FlightSearchParams,
  FlightSegment,
  PassengerBookInfo,
} from "@ryx/shared-types";

import { getApi } from "@/lib/api";
import { buildFlightPolicyParams } from "@/lib/flight-book-policy";
import {
  buildFlightDetailParams,
  normalizeFlightDetailData,
  type FlightCabinsQuery,
} from "@/lib/flight-detail";
import { loadFlightListSnapshot } from "@/lib/flight-list-session";
import { buildFlightPolicySessionKey, saveFlightPolicySession } from "@/lib/flight-policy-session";

export function buildCabinsQueryFromSegment(
  segment: FlightSegment,
  searchParams: URLSearchParams,
): FlightCabinsQuery {
  const flightNumber = segment.Number || segment.FlightNumber || "";
  const detailKey = segment.DetailKey ?? segment.Data ?? "";
  return {
    date: searchParams.get("date") ?? segment.TakeoffTime?.slice(0, 10) ?? "",
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
  };
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
}): Promise<PrefetchFlightCabinsPolicyResult> {
  const { segment, listParams, searchParams, passengers } = input;
  const query = buildCabinsQueryFromSegment(segment, searchParams);
  const detailParams = buildFlightDetailParams(query, passengers.length);
  if (!detailParams) {
    throw new Error("Incomplete flight detail parameters");
  }

  const api = getApi();
  const rawDetail = await api.flight.getFlightDetail(detailParams);
  const detail = normalizeFlightDetailData(rawDetail);
  if (!detail?.FlightFares?.length) {
    throw new Error("No cabins available for this flight");
  }

  const listSnapshot = loadFlightListSnapshot(listParams);
  const policyParams = buildFlightPolicyParams({
    listSnapshot: listSnapshot ?? undefined,
    detailSnapshot: detail,
    passengers,
  });

  let policyResults: FlightPolicyPassengerResult[] = [];
  if (policyParams) {
    policyResults = await api.flight.getFlightPolicy(policyParams);
  }

  const flightNumber = segment.Number || segment.FlightNumber || "";
  saveFlightPolicySession(
    buildFlightPolicySessionKey({
      segmentId: segment.Id,
      flightNumber,
      listParams,
      passengers,
    }),
    policyResults,
    detail,
  );

  return { detail, policyResults };
}
