import type { PassengerBookInfo, ProductType } from "@ryx/shared-types";
import { ProductType as PT } from "@ryx/shared-types";

import { getApiMode } from "@/lib/env";
import { enrichPassengerBookInfo } from "@/lib/passenger-select-logic";

function isMockPassengerEntry(item: PassengerBookInfo): boolean {
  const id = String(item.id ?? "");
  const credId = String(item.credential?.Id ?? "");
  const travelFormId =
    "travelFormId" in item.passenger ? item.passenger.travelFormId : undefined;
  if (/^P\d+$/i.test(id) || /^P\d+$/i.test(credId)) return true;
  if (travelFormId && /^TF\d+$/i.test(String(travelFormId))) return true;
  return false;
}

/** Drop mock-mode passengers when running against real APIs. */
export function sanitizePassengerSelection(items: PassengerBookInfo[]): PassengerBookInfo[] {
  if (getApiMode() === "mock") return items;
  return items.filter((item) => !isMockPassengerEntry(item));
}

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
      if (Array.isArray(parsed)) {
        const enriched = parsed.map(enrichPassengerBookInfo);
        const sanitized = sanitizePassengerSelection(enriched);
        const numbersChanged = enriched.some(
          (item, index) =>
            (item.credential.Number?.trim() ?? "") !==
            (parsed[index]?.credential.Number?.trim() ?? ""),
        );
        if (sanitized.length !== parsed.length || numbersChanged) {
          savePassengerSelection(forType, sanitized);
        }
        return sanitized;
      }
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
