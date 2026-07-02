import type { HomeTravelMode } from "@/config/home-assets";

const STORAGE_KEY = "ryx_home_travel_mode";

export type ProductChannel = "tmc" | "tourist";
export type OrderTravelType = 1 | 2;

function readSessionItem(key: string): string | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSessionItem(key: string, value: string): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // ignore quota / private mode
  }
}

/** Persist home 因公/因私 selection for downstream Book `TravelType`. */
export function saveHomeTravelMode(mode: HomeTravelMode): void {
  writeSessionItem(STORAGE_KEY, mode);
}

export function loadHomeTravelMode(): HomeTravelMode {
  const raw = readSessionItem(STORAGE_KEY);
  return raw === "personal" ? "personal" : "business";
}

export function isBusinessTravelMode(mode: HomeTravelMode = loadHomeTravelMode()): boolean {
  return mode === "business";
}

export function isPersonalTravelMode(mode: HomeTravelMode = loadHomeTravelMode()): boolean {
  return mode === "personal";
}

/** Legacy `OrderTravelType`: Business=1, Person=2. */
export function resolveOrderTravelType(mode: HomeTravelMode = loadHomeTravelMode()): OrderTravelType {
  return isPersonalTravelMode(mode) ? 2 : 1;
}

export function resolveProductChannel(mode: HomeTravelMode = loadHomeTravelMode()): ProductChannel {
  return isPersonalTravelMode(mode) ? "tourist" : "tmc";
}

export function resolveTravelModeFromProductChannel(
  channel: string | null | undefined,
  fallback: HomeTravelMode = loadHomeTravelMode(),
): HomeTravelMode {
  if (channel === "tourist") return "personal";
  if (channel === "tmc") return "business";
  return fallback;
}

export function shouldEnableTravelForm(
  mode: HomeTravelMode = loadHomeTravelMode(),
  tmcGetTravelUrl = false,
): boolean {
  return isBusinessTravelMode(mode) && tmcGetTravelUrl;
}

/** @deprecated Use `resolveOrderTravelType` for product-agnostic order builders. */
export function resolveFlightTravelType(mode: HomeTravelMode = loadHomeTravelMode()): OrderTravelType {
  return resolveOrderTravelType(mode);
}
