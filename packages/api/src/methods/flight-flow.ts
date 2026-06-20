import { FLIGHT_METHODS } from "./flight.js";
import { TMC_METHODS } from "./tmc.js";

/** Curated S5 flight flow Methods (search + list). */
export const FLIGHT_FLOW_METHODS = {
  RESOURCE_AIRPORT: TMC_METHODS.RESOURCE_AIRPORT,
  HOME_INDEX: FLIGHT_METHODS.HOME_INDEX,
  HOME_POLICY: FLIGHT_METHODS.HOME_POLICY,
} as const;

export type FlightFlowMethod =
  (typeof FLIGHT_FLOW_METHODS)[keyof typeof FLIGHT_FLOW_METHODS];
