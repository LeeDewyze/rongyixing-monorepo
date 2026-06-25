import type { FlightSegment } from "@ryx/shared-types";

import { parseLocalDate } from "@/lib/date-search";

export type FlightCardVariant = "direct-lowest" | "direct" | "transfer-lowest" | "transfer";

export function shortAirportName(name: string | undefined): string {
  if (!name) return "";
  return name
    .replace(/国际机场/g, "")
    .replace(/机场/g, "")
    .trim();
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
  group: "direct" | "transfer",
): FlightCardVariant {
  if (group === "transfer") {
    return segment.isLowestPrice ? "transfer-lowest" : "transfer";
  }
  if (segment.isLowestPrice && !segment.IsTransfer && !segment.IsStop) {
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

/** Legacy `flightMealType` pipe — supports IATA codes and API-localized labels. */
export function formatFlightMealLabel(meal: string | undefined | null): string | undefined {
  if (meal == null || meal === "") return undefined;
  const raw = String(meal).trim();
  if (!raw) return undefined;

  // Home-Index often returns localized meal text (早餐, 点心, etc.).
  if (raw.length > 1 || /[\u4e00-\u9fff]/.test(raw)) {
    return raw;
  }

  const code = raw.toUpperCase();
  const labels: Record<string, string> = {
    N: "无餐食",
    M: "不特定餐食",
    B: "早餐",
    L: "午餐",
    D: "晚餐",
    C: "免费酒精饮料",
    K: "大陆式早餐",
    S: "点心或早午餐",
    O: "冷食",
    H: "热食",
    R: "茶点或小吃",
  };

  return labels[code];
}

export function formatFlightMetaDuration(flyTimeName: string | undefined): string | undefined {
  if (!flyTimeName) return undefined;
  return flyTimeName.startsWith("飞") ? flyTimeName : `飞${flyTimeName}`;
}

/** List card airline short name, e.g. 东方航空 → 东航, 中国国航 → 国航 */
export function shortAirlineName(name: string | undefined): string {
  if (!name) return "";
  let value = name.trim();
  if (value.startsWith("中国")) {
    value = value.slice(2);
  }
  const match = value.match(/^(.+)航空$/);
  if (match) {
    return `${match[1].slice(0, 1)}航`;
  }
  return value;
}

/** List card plane label with Chinese parentheses */
export function formatFlightListPlaneLabel(planeTypeDescribe?: string, planeType?: string): string {
  const raw = planeTypeDescribe?.trim() || planeType?.trim() || "";
  if (!raw) return "";
  return raw.replace(/\(/g, "（").replace(/\)/g, "）");
}

function formatFlightListPlaneMeta(
  planeType?: string,
  planeTypeDescribe?: string,
): string | undefined {
  const code = planeType?.trim();
  if (code) return `机型 ${code}`;
  const describe = formatFlightListPlaneLabel(planeTypeDescribe, undefined);
  return describe || undefined;
}

/**
 * Legacy list card meta line: 联合航空 | KN5955 | 机型 73E | 无餐食 |
 * Uses full airline name, flight number, plane code, and meal when available.
 */
export function formatFlightListMetaLine(
  segment: Pick<
    FlightSegment,
    "AirlineName" | "Number" | "FlightNumber" | "PlaneType" | "PlaneTypeDescribe" | "Meal"
  >,
): string {
  const parts: string[] = [];

  const airlineName = segment.AirlineName?.trim();
  if (airlineName) parts.push(airlineName);

  const flightNo = (segment.Number ?? segment.FlightNumber ?? "").trim();
  if (flightNo) parts.push(flightNo);

  const planeMeta = formatFlightListPlaneMeta(segment.PlaneType, segment.PlaneTypeDescribe);
  if (planeMeta) parts.push(planeMeta);

  const meal = formatFlightMealLabel(segment.Meal);
  if (meal) parts.push(meal);

  if (!parts.length) return "";
  return parts.join(" | ");
}
