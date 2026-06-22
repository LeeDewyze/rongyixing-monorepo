import type { FlightSegment } from "@ryx/shared-types";

import { parseLocalDate } from "@/lib/date-search";

export type FlightCardVariant =
  | "direct-lowest"
  | "direct"
  | "transfer-lowest"
  | "transfer";

export function shortAirportName(name: string | undefined): string {
  if (!name) return "";
  return name.replace(/国际机场/g, "").replace(/机场/g, "").trim();
}

export function partitionFlightList(segments: FlightSegment[]): {
  directFlights: FlightSegment[];
  transferFlights: FlightSegment[];
} {
  const directFlights = segments.filter((s) => !s.IsTransfer);
  const transferFlights = segments.filter((s) => s.IsTransfer);
  return { directFlights, transferFlights };
}

export function resolveFlightCardVariant(
  segment: FlightSegment,
  indexInGroup: number,
  group: "direct" | "transfer",
): FlightCardVariant {
  if (group === "transfer") {
    return indexInGroup === 0 && segment.isLowestPrice ? "transfer-lowest" : "transfer";
  }
  if (
    indexInGroup === 0 &&
    segment.isLowestPrice &&
    !segment.IsTransfer &&
    !segment.IsStop
  ) {
    return "direct-lowest";
  }
  return "direct";
}

export function lowestFareInList(segments: FlightSegment[]): string | null {
  if (!segments.length) return null;
  const min = Math.min(...segments.map((s) => Number(s.LowestFare ?? Infinity)));
  return Number.isFinite(min) ? String(min) : null;
}

export function shouldShowScarceBadge(segment: FlightSegment): boolean {
  const n = segment.RemainSeats;
  return n != null && n > 0 && n <= 5;
}

/** Cabins header title, e.g. `1月05日 周四出发`. */
export function formatCabinsDepartTitle(takeoffTime: string | undefined): string {
  const date = takeoffTime?.slice(0, 10) ?? "";
  const d = parseLocalDate(date);
  if (!d) return "航班详情";
  const month = d.getMonth() + 1;
  const day = String(d.getDate()).padStart(2, "0");
  const week = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
  return `${month}月${day}日 周${week}出发`;
}

/** Location line, e.g. `上海·浦东T2`. */
export function formatFlightLocationLabel(
  cityName: string | undefined,
  airportName: string | undefined,
  terminal: string | undefined,
): string {
  const city = cityName?.trim() ?? "";
  const airport = shortAirportName(airportName);
  const term = terminal?.trim() ?? "";
  const place = `${airport}${term}`;
  if (city && place) return `${city}·${place}`;
  return city || place || "";
}

/** Orange +1 day badge above arrival time, e.g. `1月06日`. */
export function formatArrivalDateBadge(
  takeoffTime: string | undefined,
  arrivalTime: string | undefined,
): string | undefined {
  const depDate = takeoffTime?.slice(0, 10);
  const arrDate = arrivalTime?.slice(0, 10);
  if (!depDate || !arrDate || depDate === arrDate) return undefined;
  const d = parseLocalDate(arrDate);
  if (!d) return undefined;
  const month = d.getMonth() + 1;
  const day = String(d.getDate()).padStart(2, "0");
  return `${month}月${day}日`;
}

/** Legacy `flightMealType` pipe — simplified for H5 display. */
export function formatFlightMealLabel(meal: string | undefined | null): string | undefined {
  if (meal == null || meal === "") return undefined;
  const value = String(meal).trim().toUpperCase();
  if (!value) return undefined;
  if (value === "N") return "无餐食";
  if (value === "R" || value === "S") return "有小食";
  if (value === "B") return "早餐";
  if (value === "L") return "午餐";
  if (value === "D") return "晚餐";
  if (value === "H") return "热食";
  if (value === "O") return "冷食";
  if (value === "M") return "有餐食";
  return "有餐食";
}

export function formatFlightMetaDuration(flyTimeName: string | undefined): string | undefined {
  if (!flyTimeName) return undefined;
  return flyTimeName.startsWith("飞") ? flyTimeName : `飞${flyTimeName}`;
}
