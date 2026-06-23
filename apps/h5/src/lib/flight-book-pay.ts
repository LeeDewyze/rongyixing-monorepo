import type { FlightInitBookResponse } from "@ryx/shared-types";

/** Legacy `OrderTravelPayType`. */
export const FLIGHT_PAY_TYPE_COMPANY = 1;
export const FLIGHT_PAY_TYPE_PERSON = 2;

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

export function resolveFlightHoldMinutes(init: FlightInitBookResponse | undefined): number {
  const tmc = init?.Tmc as { FlightHoldMinute?: number } | undefined;
  const minute = tmc?.FlightHoldMinute;
  if (typeof minute === "number" && minute > 0) return minute;
  return 20;
}
