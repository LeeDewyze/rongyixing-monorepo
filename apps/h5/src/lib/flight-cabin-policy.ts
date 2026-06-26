import type {
  FlightBookPolicy,
  FlightFare,
  FlightPolicyPassengerResult,
  PassengerBookInfo,
} from "@ryx/shared-types";

import {
  coercePolicyIsAllowBook,
  findPolicyForFare,
  resolvePassengerAccountId,
} from "@/lib/flight-book-policy";

export type FlightCabinPolicyColor = "success" | "warning" | "danger" | "default";

export interface FlightCabinPolicyRow {
  fare: FlightFare;
  policy?: FlightBookPolicy;
  color: FlightCabinPolicyColor;
  isAllowBook: boolean;
}

export const FLIGHT_NO_POLICY_SEATS_MESSAGE = "该航班已无可售座位";

function resolvePolicyColor(policy: FlightBookPolicy): FlightCabinPolicyColor {
  if (!coercePolicyIsAllowBook(policy)) return "danger";
  if (policy.Rules?.length || policy.Descriptions?.length) return "warning";
  return "success";
}

function buildDefaultRows(fares: FlightFare[]): FlightCabinPolicyRow[] {
  return fares.map((fare) => ({
    fare,
    color: "default",
    isAllowBook: true,
  }));
}

function fareRowKey(fare: FlightFare): string {
  if (fare.Id != null && fare.Id !== "") return String(fare.Id);
  if (fare.Key) return `key:${fare.Key}`;
  return `code:${fare.Code ?? ""}:${fare.SalesPrice ?? ""}`;
}

function resolveMatchedFare(policy: FlightBookPolicy, fares: FlightFare[]): FlightFare | undefined {
  const matched = fares.find((fare) => findPolicyForFare([policy], fare) != null);
  if (matched) return matched;

  const cabin = policy.Cabin;
  if (cabin?.Code && cabin.SalesPrice != null) {
    return cabin;
  }

  return undefined;
}

function buildRowFromFareAndPolicy(
  fare: FlightFare,
  policy: FlightBookPolicy,
): FlightCabinPolicyRow {
  return {
    fare,
    policy,
    color: resolvePolicyColor(policy),
    isAllowBook: coercePolicyIsAllowBook(policy),
  };
}

function mergePolicyWithFare(
  policy: FlightBookPolicy,
  fares: FlightFare[],
): FlightCabinPolicyRow | null {
  const matchedFare = resolveMatchedFare(policy, fares);
  if (!matchedFare) return null;
  return buildRowFromFareAndPolicy(matchedFare, policy);
}

function dedupePolicyRows(rows: FlightCabinPolicyRow[]): FlightCabinPolicyRow[] {
  const seen = new Set<string>();
  const deduped: FlightCabinPolicyRow[] = [];
  for (const row of rows) {
    const key = fareRowKey(row.fare);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(row);
  }
  return deduped;
}

function enrichFaresWithPolicy(
  fares: FlightFare[],
  policies: FlightBookPolicy[],
): FlightCabinPolicyRow[] {
  const rows = fares.map((fare) => {
    const policy = findPolicyForFare(policies, fare);
    if (policy) return buildRowFromFareAndPolicy(fare, policy);
    return {
      fare,
      color: "default" as const,
      isAllowBook: true,
    };
  });

  const knownKeys = new Set(rows.map((row) => fareRowKey(row.fare)));
  for (const policy of policies) {
    const merged = mergePolicyWithFare(policy, fares);
    if (!merged) continue;
    const key = fareRowKey(merged.fare);
    if (knownKeys.has(key)) continue;
    rows.push(merged);
    knownKeys.add(key);
  }

  return dedupePolicyRows(rows);
}

function findPassengerPolicyEntry(
  results: FlightPolicyPassengerResult[],
  passengers: PassengerBookInfo[],
  filterPassengerId: string,
): FlightPolicyPassengerResult | undefined {
  const passenger = passengers.find((item) => item.id === filterPassengerId);
  if (!passenger) return undefined;
  const accountId = resolvePassengerAccountId(passenger);

  const entry =
    results.find((item) => String(item.PassengerKey ?? "") === accountId) ??
    (results.length === 1 ? results[0] : undefined);

  return entry;
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

/** Legacy `filterPassengerPolicyCabins` — client-side cabin filter and color map. */
export function filterFlightFaresByPolicy(input: {
  fares: FlightFare[];
  policyResults?: FlightPolicyPassengerResult[];
  passengers: PassengerBookInfo[];
  filterPassengerId: string | null;
  filterEnabled: boolean;
  flightNumber: string;
}): FlightCabinPolicyRow[] {
  const { fares, policyResults, passengers, filterPassengerId, filterEnabled, flightNumber } =
    input;

  if (!fares.length) return [];

  if (!filterEnabled || !filterPassengerId || !policyResults?.length) {
    return buildDefaultRows(fares);
  }

  const entry = findPassengerPolicyEntry(policyResults, passengers, filterPassengerId);
  if (!entry) {
    return buildDefaultRows(fares);
  }

  const policies = policiesForFlight(entry.FlightPolicies, flightNumber);
  if (!policies.length) {
    return [];
  }

  return enrichFaresWithPolicy(fares, policies);
}

export function resolvePolicyForRow(input: {
  row: FlightCabinPolicyRow;
  policyResults?: FlightPolicyPassengerResult[];
  passengers: PassengerBookInfo[];
  filterPassengerId: string | null;
  flightNumber: string;
}): FlightBookPolicy | undefined {
  if (input.row.policy) return input.row.policy;
  const { policyResults, passengers, filterPassengerId, flightNumber, row } = input;
  if (!policyResults?.length || !filterPassengerId) return undefined;

  const entry = findPassengerPolicyEntry(policyResults, passengers, filterPassengerId);
  if (!entry) return undefined;

  const policies = policiesForFlight(entry.FlightPolicies, flightNumber);
  return findPolicyForFare(policies, row.fare);
}

export function attachPolicyToRow(
  row: FlightCabinPolicyRow,
  input: Omit<Parameters<typeof resolvePolicyForRow>[0], "row">,
): FlightCabinPolicyRow {
  const policy = resolvePolicyForRow({ ...input, row });
  if (!policy) return row;
  return buildRowFromFareAndPolicy(row.fare, policy);
}

export function isFlightCabinRowBookable(row: FlightCabinPolicyRow, isAgent: boolean): boolean {
  if (!row.fare) return false;
  if (isFlightCabinSoldOut(row)) return false;
  if (isAgent) return true;
  return row.isAllowBook;
}

export function isFlightCabinSoldOut(row: FlightCabinPolicyRow): boolean {
  const count = row.fare?.Count;
  return count != null && count !== "" && Number(count) === 0;
}

/** Legacy exceed alert: button stays tappable; booking is blocked in handler. */
export function isFlightCabinPolicyBlocked(row: FlightCabinPolicyRow, isAgent: boolean): boolean {
  if (!row.policy || isAgent) return false;
  return !coercePolicyIsAllowBook(row.policy);
}

/** Card hint — prefer Descriptions, then first Rule. */
export function formatFlightCabinPolicyHint(policy?: FlightBookPolicy): string {
  if (!policy) return "";
  const description = policy.Descriptions?.map((item) => item.trim()).find(Boolean);
  if (description) return description;
  const rule = policy.Rules?.map((item) => item.trim()).find(Boolean);
  return rule ?? "";
}
