import type {
  FlightBookPolicy,
  FlightDetailResult,
  FlightFare,
  FlightFareVariables,
  FlightListResult,
  FlightPolicyParams,
  FlightPolicyPassengerResult,
  PassengerBookInfo,
} from "@ryx/shared-types";
import { maskCredentialNumber } from "@ryx/shared-types";

import { selectCabinsForSegment } from "@ryx/api";

import type { FlightBookSelection } from "@/lib/flight-book-session";
import { applyLegacyInitDetailResult } from "@/lib/flight-detail";
import { isSpringAirlinesBlockedForSave } from "@/lib/flight-book-save-order";
import { serializeFlightsForPolicy } from "@/lib/flight-book-cabin";

/**
 * Legacy `replaceOldFlightSegmentInfo` — attach Home-Detail fares to the matching
 * list segment as `Cabins` so the backend can return per-cabin policies keyed by
 * fare `Id`. Without this the Home-Policy response carries no cabin-level policy.
 */
function mergeDetailCabinsIntoListSnapshot(
  listSnapshot: FlightListResult,
  detail: FlightDetailResult,
  flightNumber: string,
): FlightListResult {
  const result = listSnapshot.Result;
  const segments = result?.FlightSegments;
  if (!result || !segments?.length || !flightNumber) return listSnapshot;

  const cabins = selectCabinsForSegment(detail, flightNumber);
  if (!cabins.length) return listSnapshot;

  const upper = flightNumber.toUpperCase();
  const lowestFare = [...cabins].sort(
    (a, b) => Number(a.SalesPrice ?? 0) - Number(b.SalesPrice ?? 0),
  )[0];

  let merged = false;
  const nextSegments = segments.map((segment) => {
    const segNumber = (segment.Number ?? segment.FlightNumber ?? "").toUpperCase();
    if (segment.Cabins?.length || segNumber !== upper) return segment;
    merged = true;
    return {
      ...segment,
      Cabins: cabins,
      LowestFare: lowestFare?.SalesPrice ?? segment.LowestFare,
      Tax: lowestFare?.Tax ?? segment.Tax,
    };
  });

  if (!merged) return listSnapshot;
  return { ...listSnapshot, Result: { ...result, FlightSegments: nextSegments } };
}

/** Account id sent to Home-Policy and used to match `PassengerKey`. */
export function resolvePassengerAccountId(passenger: PassengerBookInfo): string {
  const fromPassenger =
    "AccountId" in passenger.passenger && passenger.passenger.AccountId
      ? String(passenger.passenger.AccountId)
      : "";
  const fromCredential = passenger.credential.AccountId
    ? String(passenger.credential.AccountId)
    : "";
  return fromPassenger || fromCredential || String(passenger.id);
}

export function buildFlightPolicyParams(input: {
  listSnapshot?: FlightListResult;
  detailSnapshot?: FlightDetailResult;
  passengers: PassengerBookInfo[];
  travelFormId?: string;
}): FlightPolicyParams | null {
  const { listSnapshot, detailSnapshot, passengers, travelFormId } = input;
  if (!detailSnapshot || passengers.length === 0) return null;

  const accountIds = passengers
    .map((item) => resolvePassengerAccountId(item))
    .filter(Boolean)
    .join(",");

  if (!accountIds) return null;

  const travelFormIds = passengers
    .map((item) => ("travelFormId" in item.passenger ? item.passenger.travelFormId : undefined))
    .filter((value): value is string => Boolean(value && String(value).trim()));

  const flightNumber =
    detailSnapshot.FlightSegments?.[0]?.Number ??
    detailSnapshot.FlightSegments?.[0]?.FlightNumber ??
    "";
  const flightsSnapshot = listSnapshot
    ? mergeDetailCabinsIntoListSnapshot(listSnapshot, detailSnapshot, flightNumber)
    : undefined;

  return {
    Flights: flightsSnapshot
      ? serializeFlightsForPolicy(flightsSnapshot)
      : JSON.stringify(detailSnapshot),
    Passengers: accountIds,
    FlightDetail: JSON.stringify(detailSnapshot),
    TravelFromId: travelFormId ?? (travelFormIds.length ? travelFormIds.join(",") : undefined),
  };
}

export function resolvePassengerFlightPolicy(
  results: FlightPolicyPassengerResult[] | undefined,
  passenger: PassengerBookInfo,
  fare: FlightFare,
  segmentNumber?: string,
): FlightBookPolicy | undefined {
  if (!results?.length) return undefined;

  const accountId = resolvePassengerAccountId(passenger);
  const entry = results.find((item) => String(item.PassengerKey ?? "") === accountId) ?? results[0];
  const flightNo = segmentNumber ?? fare.FlightNumber ?? "";
  const policies = policiesForFlight(entry?.FlightPolicies, flightNo);
  const matched = findPolicyForFare(policies, fare);

  if (!matched) return undefined;
  return {
    ...matched,
    Cabin: matched.Cabin ?? fare,
  };
}

function policiesForFlight(
  policies: FlightBookPolicy[] | undefined,
  flightNumber: string,
): FlightBookPolicy[] {
  if (!policies?.length) return [];
  const normalized = flightNumber.trim().toUpperCase();
  if (!normalized) return policies;
  const matched = policies.filter((policy) => {
    const flightNo = (policy.FlightNo ?? "").toUpperCase();
    return !flightNo || flightNo === normalized || flightNo.includes(normalized);
  });
  return matched.length > 0 ? matched : policies;
}

/** Collect cabin codes used by proxy/Home-Detail fares for policy matching. */
export function resolveFareCabinCodes(fare: FlightFare): string[] {
  const codes = new Set<string>();
  const add = (value: unknown) => {
    if (value == null || value === "") return;
    codes.add(String(value).trim().toUpperCase());
  };

  add(fare.Code);
  add(fare.BookCode);
  for (const basic of fare.FlightFareBasics ?? []) {
    add(basic.CabinCode);
    add(basic.FareBasic);
  }

  const variables = resolveFareVariables(fare);
  add(variables?.FareBasis);
  add(variables?.FareBasic);

  return [...codes];
}

/** Collect fare identifiers used for Home-Policy row matching. */
export function resolveFareMatchIds(fare: FlightFare): string[] {
  const ids = new Set<string>();
  const add = (value: unknown) => {
    if (value == null || value === "") return;
    ids.add(String(value));
  };

  add(fare.Id);
  add(fare.Key);
  const variables = resolveFareVariables(fare);
  add(variables?.BizCode);

  return [...ids];
}

function resolveFareVariables(fare: FlightFare): FlightFareVariables | undefined {
  if (fare.VariablesObj) return fare.VariablesObj;
  if (typeof fare.Variables === "string") {
    try {
      return JSON.parse(fare.Variables) as FlightFareVariables;
    } catch {
      return undefined;
    }
  }
  if (fare.Variables && typeof fare.Variables === "object") {
    return fare.Variables as FlightFareVariables;
  }
  return undefined;
}

function normalizeFareForPolicyMatch(fare: FlightFare): FlightFare {
  return applyLegacyInitDetailResult(fare);
}

function farePricesMatch(policyFare: FlightFare, fare: FlightFare): boolean {
  const cabinPrice = policyFare.SalesPrice ?? policyFare.TicketPrice;
  const farePrice = fare.SalesPrice ?? fare.TicketPrice;
  if (cabinPrice == null || cabinPrice === "" || farePrice == null || farePrice === "") {
    return true;
  }
  return Number(cabinPrice) === Number(farePrice);
}

function policyMatchesFare(policy: FlightBookPolicy, fare: FlightFare): boolean {
  const normalizedFare = normalizeFareForPolicyMatch(fare);
  const fareIds = new Set(resolveFareMatchIds(normalizedFare));
  const fareCodes = new Set(resolveFareCabinCodes(normalizedFare));

  if (policy.Id != null && policy.Id !== "") {
    const policyId = String(policy.Id);
    if (fareIds.has(policyId)) return true;
    if (fareCodes.has(policyId.toUpperCase())) return true;
  }

  const cabin = policy.Cabin ? normalizeFareForPolicyMatch(policy.Cabin) : undefined;
  if (!cabin) return false;

  const cabinIds = new Set(resolveFareMatchIds(cabin));
  for (const id of fareIds) {
    if (cabinIds.has(id)) return true;
  }

  const cabinCodes = new Set(resolveFareCabinCodes(cabin));
  const sharedCodes = [...fareCodes].filter((code) => cabinCodes.has(code));
  if (!sharedCodes.length) return false;

  return farePricesMatch(cabin, normalizedFare);
}

/** Match a Home-Policy row to a Home-Detail fare (Id / Key / Code tolerant). */
export function findPolicyForFare(
  policies: FlightBookPolicy[],
  fare: FlightFare,
): FlightBookPolicy | undefined {
  const matched = policies.filter((policy) => policyMatchesFare(policy, fare));
  if (!matched.length) return undefined;
  return matched.find((policy) => !coercePolicyIsAllowBook(policy)) ?? matched[0];
}

export function resolveSelectionFlightPolicy(
  selection: FlightBookSelection,
): FlightBookPolicy | undefined {
  return selection.flightPolicy;
}

export function buildPassengerFlightPoliciesMap(input: {
  results: FlightPolicyPassengerResult[] | undefined;
  passengers: PassengerBookInfo[];
  fare: FlightFare;
  segmentNumber?: string;
}): Record<string, FlightBookPolicy> {
  const { results, passengers, fare, segmentNumber } = input;
  const map: Record<string, FlightBookPolicy> = {};
  for (const passenger of passengers) {
    const policy = resolvePassengerFlightPolicy(results, passenger, fare, segmentNumber);
    if (policy) {
      map[passenger.id] = policy;
    }
  }
  return map;
}

export function resolvePassengerPolicyFromSelection(
  selection: FlightBookSelection,
  passenger: PassengerBookInfo,
): FlightBookPolicy | undefined {
  return selection.flightPoliciesByPassengerId?.[passenger.id] ?? selection.flightPolicy;
}

export function policyHasViolation(policy?: FlightBookPolicy): boolean {
  return Boolean(policy?.Rules?.length);
}

/** Legacy API may return IsAllowBook as string/number — coerce before strict checks. */
export function coercePolicyIsAllowBook(policy?: FlightBookPolicy): boolean {
  const raw = policy?.IsAllowBook;
  if (raw === false || raw === 0 || raw === "0" || raw === "false" || raw === "False") {
    return false;
  }
  if (raw === true || raw === 1 || raw === "1" || raw === "true" || raw === "True") {
    return true;
  }
  return true;
}

/** Legacy `checkIfCabinIsAllowBook`: agents may book; others blocked when `IsAllowBook === false`. */
export function isFlightPolicyBookAllowed(
  policy: FlightBookPolicy | undefined,
  isAgent: boolean,
): boolean {
  if (isAgent) return true;
  return coercePolicyIsAllowBook(policy);
}

export const FLIGHT_POLICY_FETCH_FAILED_MESSAGE = "差标获取失败，请稍后重试";

/** Non-agents must not proceed when policy API fails; agents may book without policy (Legacy). */
export function shouldBlockBookingOnPolicyFetchFailure(isAgent: boolean): boolean {
  return !isAgent;
}

export function formatFlightPolicyBookBlockMessage(
  policy?: FlightBookPolicy,
  passenger?: PassengerBookInfo | string,
): string {
  const name =
    typeof passenger === "string" ? passenger.trim() : (passenger?.passenger.Name?.trim() ?? "");
  const credential =
    passenger && typeof passenger !== "string"
      ? maskCredentialNumber(passenger.credential.Number ?? passenger.credential.HideNumber ?? "")
      : "";
  const identity = credential ? `(${credential})` : "";
  const rules = policy?.Rules?.length ? policy.Rules.join(";") : "";
  if (name && rules) return `${name}${identity};${rules}，超标不可预订`;
  if (name) return `${name}${identity}，超标不可预订`;
  if (rules) return `${rules}，超标不可预订`;
  return "该舱位超标不可预订";
}

export function formatPolicyDescriptions(policy?: FlightBookPolicy): string {
  if (!policy?.Descriptions?.length) return "";
  return policy.Descriptions.join(" | ");
}

export function formatPolicyRules(policy?: FlightBookPolicy): string {
  if (!policy?.Rules?.length) return "";
  return policy.Rules.join(", ");
}

export function isSpringAirlineReminder(segmentAirline?: string, airlineName?: string): boolean {
  return isSpringAirlinesBlockedForSave({ airline: segmentAirline, airlineName });
}
