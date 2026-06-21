import type { FlightSegment } from "@ryx/shared-types";

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
