import type { PassengerBookInfo, ProductType } from "@ryx/shared-types";

const STORAGE_PREFIX = "ryx_passenger_selection_";
export const PASSENGER_SELECTION_EVENT = "ryx-passenger-selection-change";

export function passengerSelectionKey(forType: ProductType): string {
  return `${STORAGE_PREFIX}${forType}`;
}

export function loadPassengerSelection(forType: ProductType): PassengerBookInfo[] {
  try {
    const raw = localStorage.getItem(passengerSelectionKey(forType));
    if (raw) {
      const parsed = JSON.parse(raw) as PassengerBookInfo[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* ignore */
  }
  return [];
}

export function savePassengerSelection(
  forType: ProductType,
  items: PassengerBookInfo[],
): void {
  const key = passengerSelectionKey(forType);
  localStorage.setItem(key, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(PASSENGER_SELECTION_EVENT, { detail: { key } }));
}

export function clearPassengerSelection(forType: ProductType): void {
  localStorage.removeItem(passengerSelectionKey(forType));
}

export function buildPassengerSelectPath(forType: ProductType, returnTo: string): string {
  const params = new URLSearchParams({
    forType: String(forType),
    returnTo,
  });
  return `/passenger/select?${params.toString()}`;
}
