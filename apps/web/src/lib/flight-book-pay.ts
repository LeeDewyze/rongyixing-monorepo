import type { FlightInitBookResponse, PassengerBookInfo } from "@ryx/shared-types";

import { resolvePassengerServiceFee } from "@/lib/flight-book";

/** Legacy `OrderTravelPayType`. */
export const FLIGHT_PAY_TYPE_COMPANY = 1;
export const FLIGHT_PAY_TYPE_PERSON = 2;
export const FLIGHT_PAY_TYPE_CREDIT = 4;

export interface FlightPayTypeOption {
  value: number;
  label: string;
}

const DEFAULT_PAY_OPTIONS: FlightPayTypeOption[] = [
  { value: FLIGHT_PAY_TYPE_COMPANY, label: "公付" },
  { value: FLIGHT_PAY_TYPE_PERSON, label: "个付" },
];

export function parseFlightPayTypeOptions(
  payTypes: Record<string, string> | undefined,
): FlightPayTypeOption[] {
  if (!payTypes || !Object.keys(payTypes).length) return DEFAULT_PAY_OPTIONS;
  return Object.entries(payTypes)
    .map(([key, label]) => ({ value: Number(key), label }))
    .filter((item) => Number.isFinite(item.value) && item.label)
    .sort((a, b) => a.value - b.value);
}

export function resolveDefaultFlightPayType(options: FlightPayTypeOption[]): number {
  return (
    options.find((item) => item.value === FLIGHT_PAY_TYPE_COMPANY)?.value ??
    options[0]?.value ??
    FLIGHT_PAY_TYPE_COMPANY
  );
}

export function resolveFlightBookAgentId(
  agentId: string | null | undefined,
  agents: Array<{ Id?: string | number }>,
): string | undefined {
  if (agentId) return agentId;
  if (agents.length === 0) return undefined;
  return String(agents[0]?.Id ?? "");
}

/** Legacy: `selectedTmcAgent = selectedTmcAgent || tmcAgents[0]` after Initialize. */
export function resolveInitialFlightBookAgentId(
  currentAgentId: string | null,
  agents: Array<{ Id?: string | number }>,
): string | null {
  if (currentAgentId) return currentAgentId;
  return resolveFlightBookAgentId(null, agents) ?? null;
}

export function resolveFlightHoldMinutes(init: FlightInitBookResponse | undefined): number {
  const tmc = init?.Tmc as { FlightHoldMinute?: number } | undefined;
  const minute = tmc?.FlightHoldMinute;
  if (typeof minute === "number" && minute > 0) return minute;
  return 20;
}

export function resolveFlightBookTmcFlags(init: FlightInitBookResponse | undefined): {
  isShowServiceFee: boolean;
  isDisplayNotifyLanguage: boolean;
} {
  const tmc = init?.Tmc as
    | { IsShowServiceFee?: boolean; IsDisplayNotifyLanguage?: boolean }
    | undefined;
  return {
    isShowServiceFee: Boolean(tmc?.IsShowServiceFee),
    isDisplayNotifyLanguage: Boolean(tmc?.IsDisplayNotifyLanguage),
  };
}

export function resolveTotalServiceFee(
  passengers: PassengerBookInfo[],
  serviceFees?: Record<string, number | string>,
): number {
  if (!serviceFees || passengers.length === 0) return 0;
  return passengers.reduce(
    (sum, passenger) => sum + resolvePassengerServiceFee(passenger, serviceFees),
    0,
  );
}
