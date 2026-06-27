import type { TrainInitBookResponse } from "@ryx/shared-types";

export const TRAIN_PAY_TYPE_COMPANY = 1;
export const TRAIN_PAY_TYPE_PERSON = 2;

export interface TrainPayTypeOption {
  value: number;
  label: string;
}

const DEFAULT_PAY_OPTIONS: TrainPayTypeOption[] = [
  { value: TRAIN_PAY_TYPE_COMPANY, label: "公付" },
  { value: TRAIN_PAY_TYPE_PERSON, label: "个付" },
];

export function parseTrainPayTypeOptions(
  payTypes: Record<string, string> | undefined,
): TrainPayTypeOption[] {
  if (!payTypes || !Object.keys(payTypes).length) return DEFAULT_PAY_OPTIONS;
  return Object.entries(payTypes)
    .map(([key, label]) => ({ value: Number(key), label }))
    .filter((item) => Number.isFinite(item.value) && item.label)
    .sort((a, b) => a.value - b.value);
}

export function resolveDefaultTrainPayType(options: TrainPayTypeOption[]): number {
  return (
    options.find((item) => item.value === TRAIN_PAY_TYPE_COMPANY)?.value ??
    options[0]?.value ??
    TRAIN_PAY_TYPE_COMPANY
  );
}

export function resolveTrainHoldMinutes(init: TrainInitBookResponse | undefined): number {
  const tmc = init?.Tmc as { TrainHoldMinute?: number; FlightHoldMinute?: number } | undefined;
  const minute = tmc?.TrainHoldMinute ?? tmc?.FlightHoldMinute;
  if (typeof minute === "number" && minute > 0) return minute;
  return 20;
}

export function resolveTrainBookTmcFlags(init: TrainInitBookResponse | undefined): {
  isShowServiceFee: boolean;
  isDisplayNotifyLanguage: boolean;
} {
  const tmc = init?.Tmc as
    | { IsShowServiceFee?: boolean; IsDisplayNotifyLanguage?: boolean }
    | undefined;
  return {
    isShowServiceFee: Boolean(tmc?.IsShowServiceFee),
    isDisplayNotifyLanguage: tmc?.IsDisplayNotifyLanguage !== false,
  };
}
