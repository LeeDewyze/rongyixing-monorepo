import type {
  FlightBookPolicy,
  FlightDetailResult,
  FlightFare,
  FlightListResult,
  FlightPolicyParams,
  FlightPolicyPassengerResult,
  PassengerBookInfo,
} from "@ryx/shared-types";

import type { FlightBookSelection } from "@/lib/flight-book-session";
import { isSpringAirlinesBlockedForSave } from "@/lib/flight-book-save-order";
import { serializeFlightsForPolicy } from "@/lib/flight-book-cabin";

export function buildFlightPolicyParams(input: {
  listSnapshot?: FlightListResult;
  detailSnapshot?: FlightDetailResult;
  passengers: PassengerBookInfo[];
  travelFormId?: string;
}): FlightPolicyParams | null {
  const { listSnapshot, detailSnapshot, passengers, travelFormId } = input;
  if (!detailSnapshot || passengers.length === 0) return null;

  const accountIds = passengers
    .map((item) => item.passenger.AccountId ?? item.id)
    .filter(Boolean)
    .join(",");

  if (!accountIds) return null;

  const travelFormIds = passengers
    .map((item) => ("travelFormId" in item.passenger ? item.passenger.travelFormId : undefined))
    .filter((value): value is string => Boolean(value && String(value).trim()));

  return {
    Flights: listSnapshot
      ? serializeFlightsForPolicy(listSnapshot)
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

  const accountId = String(passenger.passenger.AccountId ?? passenger.id);
  const entry =
    results.find((item) => String(item.PassengerKey ?? "") === accountId) ?? results[0];
  const flightNo = segmentNumber ?? fare.FlightNumber ?? "";
  const policies = entry?.FlightPolicies ?? [];
  const matched =
    policies.find((policy) => policy.Id === fare.Id) ??
    policies.find((policy) => !flightNo || (policy.FlightNo ?? "").includes(flightNo)) ??
    policies[0];

  if (!matched) return undefined;
  return {
    ...matched,
    Cabin: matched.Cabin ?? fare,
  };
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
  return (
    selection.flightPoliciesByPassengerId?.[passenger.id] ??
    selection.flightPolicy
  );
}

export function policyHasViolation(policy?: FlightBookPolicy): boolean {
  return Boolean(policy?.Rules?.length);
}

/** Legacy `checkIfCabinIsAllowBook`: agents may book; others blocked when `IsAllowBook === false`. */
export function isFlightPolicyBookAllowed(
  policy: FlightBookPolicy | undefined,
  isAgent: boolean,
): boolean {
  if (isAgent) return true;
  return policy?.IsAllowBook !== false;
}

export function formatFlightPolicyBookBlockMessage(
  policy?: FlightBookPolicy,
  passengerName?: string,
): string {
  const rules = policy?.Rules?.length ? policy.Rules.join(";") : "";
  if (passengerName && rules) return `${passengerName};${rules}，超标不可预订`;
  if (passengerName) return `${passengerName}，超标不可预订`;
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
