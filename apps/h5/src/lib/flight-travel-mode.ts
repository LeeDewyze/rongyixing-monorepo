import type { HomeTravelMode } from "@/config/home-assets";

const STORAGE_KEY = "ryx_home_travel_mode";

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

/** Legacy `OrderTravelType`: Business=1, Person=2. */
export function resolveFlightTravelType(mode: HomeTravelMode = loadHomeTravelMode()): number {
  return mode === "personal" ? 2 : 1;
}
