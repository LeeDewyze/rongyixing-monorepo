import type {
  FlightDetailResult,
  FlightPolicyPassengerResult,
  FlightSearchParams,
  PassengerBookInfo,
} from "@ryx/shared-types";

import { flightListRouteKey, passengerSelectionFingerprint } from "@/lib/flight-list-refresh";

const STORAGE_KEY = "ryx_flight_policy_session";

export interface FlightPolicySessionKey {
  segmentId: string;
  flightNumber: string;
  routeKey: string;
  passengerFingerprint: string;
}

export interface StoredFlightPolicySession {
  key: FlightPolicySessionKey;
  policyResults: FlightPolicyPassengerResult[];
  detailSnapshot?: FlightDetailResult;
  savedAt: number;
}

export function buildFlightPolicySessionKey(input: {
  segmentId: string;
  flightNumber: string;
  listParams: FlightSearchParams;
  passengers: PassengerBookInfo[];
}): FlightPolicySessionKey {
  return {
    segmentId: input.segmentId,
    flightNumber: input.flightNumber,
    routeKey: flightListRouteKey(input.listParams),
    passengerFingerprint: passengerSelectionFingerprint(input.passengers),
  };
}

function sessionKeyMatches(
  stored: FlightPolicySessionKey,
  expected: FlightPolicySessionKey,
): boolean {
  return (
    stored.segmentId === expected.segmentId &&
    stored.flightNumber === expected.flightNumber &&
    stored.routeKey === expected.routeKey &&
    stored.passengerFingerprint === expected.passengerFingerprint
  );
}

export function saveFlightPolicySession(
  key: FlightPolicySessionKey,
  policyResults: FlightPolicyPassengerResult[],
  detailSnapshot?: FlightDetailResult,
): void {
  const payload: StoredFlightPolicySession = {
    key,
    policyResults,
    detailSnapshot,
    savedAt: Date.now(),
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function loadFlightPolicySession(
  expected: FlightPolicySessionKey,
): StoredFlightPolicySession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredFlightPolicySession;
    if (!sessionKeyMatches(parsed.key, expected)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearFlightPolicySession(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
