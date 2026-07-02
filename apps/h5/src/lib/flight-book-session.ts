import type { FlightDetailResult, FlightFare, FlightListResult, FlightSegment } from "@ryx/shared-types";
import type { FlightBookPolicy } from "@ryx/shared-types";

import type { FlightCabinsQuery } from "@/lib/flight-detail";
import type { HomeTravelMode } from "@/config/home-assets";

const STORAGE_KEY = "ryx_flight_book_selection";
export const FLIGHT_BOOK_SELECTION_EVENT = "ryx-flight-book-selection-change";

export interface FlightBookSelection {
  flightId: string;
  cabinsQuery: FlightCabinsQuery;
  segment: FlightSegment;
  fare: FlightFare;
  detailSnapshot?: FlightDetailResult;
  listSnapshot?: FlightListResult;
  /** Primary policy (first passenger) — banner / backward compat. */
  flightPolicy?: FlightBookPolicy;
  /** Per-passenger Home-Policy result — Legacy `bookInfo.flightPolicy` per passenger. */
  flightPoliciesByPassengerId?: Record<string, FlightBookPolicy>;
  /** When cabin prices were last fetched — used for 10-minute timeout. */
  priceSnapshotAt: number;
  selectedAt: number;
  travelMode?: HomeTravelMode;
}

function notifyChange(): void {
  window.dispatchEvent(new CustomEvent(FLIGHT_BOOK_SELECTION_EVENT));
}

export function loadFlightBookSelection(): FlightBookSelection | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FlightBookSelection;
    if (!parsed?.segment || !parsed?.fare || !parsed?.cabinsQuery) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveFlightBookSelection(selection: FlightBookSelection): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
  notifyChange();
}

export function clearFlightBookSelection(): void {
  sessionStorage.removeItem(STORAGE_KEY);
  notifyChange();
}

export function buildCabinsHref(selection: FlightBookSelection): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(selection.cabinsQuery)) {
    if (value !== "" && value != null) {
      params.set(key, String(value));
    }
  }
  return `/flight/${encodeURIComponent(selection.flightId)}/cabins?${params.toString()}`;
}
