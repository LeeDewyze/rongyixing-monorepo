import type { IdentityDto } from "@ryx/shared-types";
import type { FlightSegment } from "@ryx/shared-types";

import type { FlightCabinsQuery } from "@/lib/flight-detail";

/** Legacy `identity.Numbers.AgentId` — logged-in user is an agency operator. */
export function hasAgentIdentity(identity?: IdentityDto | null): boolean {
  const agentId = identity?.Numbers?.AgentId;
  return Boolean(agentId && String(agentId).trim() && String(agentId) !== "0");
}

/** Legacy blocks save for Spring Airlines (9C / 春秋航空). */
export function isSpringAirlinesBlockedForSave(input: {
  airline?: string;
  airlineName?: string;
}): boolean {
  if (input.airline === "9C") return true;
  return Boolean(input.airlineName?.includes("春秋航空"));
}

export function canSaveFlightOrder(input: {
  identity?: IdentityDto | null;
  segment?: FlightSegment;
  cabinsQuery?: FlightCabinsQuery;
}): boolean {
  if (!hasAgentIdentity(input.identity)) return false;

  const segment = input.segment;
  const cabinsQuery = input.cabinsQuery;
  return !isSpringAirlinesBlockedForSave({
    airline: segment?.Airline,
    airlineName: segment?.AirlineName ?? cabinsQuery?.airlineName,
  });
}
