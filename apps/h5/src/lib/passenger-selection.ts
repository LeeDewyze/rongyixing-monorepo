import type { PassengerBookInfo, ProductType } from "@ryx/shared-types";
import { ProductType as PT } from "@ryx/shared-types";

const STORAGE_PREFIX = "ryx_passenger_selection_";
export const PASSENGER_SELECTION_EVENT = "ryx-passenger-selection-change";

function notifySelectionChange(forType: ProductType): void {
  window.dispatchEvent(
    new CustomEvent(PASSENGER_SELECTION_EVENT, {
      detail: { key: passengerSelectionKey(forType) },
    }),
  );
}

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
  localStorage.setItem(passengerSelectionKey(forType), JSON.stringify(items));
  notifySelectionChange(forType);
}

export function clearPassengerSelection(forType: ProductType): void {
  localStorage.removeItem(passengerSelectionKey(forType));
  notifySelectionChange(forType);
}

export function clearAllPassengerSelections(): void {
  clearPassengerSelection(PT.Flight);
  clearPassengerSelection(PT.Hotel);
  clearPassengerSelection(PT.Train);
}

export function buildPassengerSelectPath(forType: ProductType, returnTo: string): string {
  const params = new URLSearchParams({
    forType: String(forType),
    returnTo,
  });
  return `/passenger/select?${params.toString()}`;
}
