import type { FlightListResult, FlightSearchParams } from "@ryx/shared-types";

import { flightListRouteKey } from "@/lib/flight-list-refresh";

const STORAGE_KEY = "ryx_flight_list_snapshot";

interface StoredFlightListSnapshot {
  routeKey: string;
  result: FlightListResult;
  savedAt: number;
}

export function saveFlightListSnapshot(
  params: FlightSearchParams,
  result: FlightListResult,
): void {
  const payload: StoredFlightListSnapshot = {
    routeKey: flightListRouteKey(params),
    result,
    savedAt: Date.now(),
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function loadFlightListSnapshot(
  params: FlightSearchParams,
): FlightListResult | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredFlightListSnapshot;
    if (parsed.routeKey !== flightListRouteKey(params)) return null;
    return parsed.result ?? null;
  } catch {
    return null;
  }
}
