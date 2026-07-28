import type { HomeBookProduct, RegionType } from "@ryx/shared-types";

export const HOME_BOOK_PRODUCTS: HomeBookProduct[] = ["flight", "train", "hotel"];

function readBool(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

function unwrapRegionRecord(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  const nested = record.Data;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return nested as Record<string, unknown>;
  }
  return record;
}

export function normalizeRegionType(raw: unknown): RegionType | null {
  const record = unwrapRegionRecord(raw);
  if (!record) return null;
  return {
    HasFlight: readBool(record.HasFlight ?? record.hasFlight),
    HasInternationalFlight: readBool(
      record.HasInternationalFlight ?? record.hasInternationalFlight,
    ),
    HasTrain: readBool(record.HasTrain ?? record.hasTrain),
    HasHotel: readBool(record.HasHotel ?? record.hasHotel),
    HasInternationalHotel: readBool(record.HasInternationalHotel ?? record.hasInternationalHotel),
    HasGP: readBool(record.HasGP ?? record.hasGP ?? record.HasGp ?? record.hasGp),
    HasCar: readBool(record.HasCar ?? record.hasCar),
    HasRentalCar: readBool(record.HasRentalCar ?? record.hasRentalCar),
  };
}

/**
 * Mirrors legacy `TmcService.hasBookRight` for home search product tabs.
 * - `undefined`: not loaded yet — keep tabs visible to avoid layout flicker.
 * - `null`: loaded but missing/invalid — deny (legacy returns false when cache empty).
 */
export function hasHomeProductBookRight(
  region: RegionType | null | undefined,
  product: HomeBookProduct,
): boolean {
  if (region === undefined) return true;
  if (region === null) return false;

  switch (product) {
    case "flight":
      return region.HasFlight;
    case "train":
      return region.HasTrain;
    case "hotel":
      return region.HasHotel;
    default:
      return false;
  }
}

export function filterVisibleHomeProducts(
  region: RegionType | null | undefined,
  order: readonly HomeBookProduct[] = HOME_BOOK_PRODUCTS,
): HomeBookProduct[] {
  return order.filter((product) => hasHomeProductBookRight(region, product));
}
