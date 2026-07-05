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

/** Legacy exchange book uses Tmc.TrainExchangeOnlineFee when present. */
export function resolveTrainExchangeOnlineFee(
  init: TrainInitBookResponse | undefined,
): number | undefined {
  const tmc = init?.Tmc as { TrainExchangeOnlineFee?: number | string } | undefined;
  const fee = tmc?.TrainExchangeOnlineFee;
  if (typeof fee === "number" && !Number.isNaN(fee)) return fee;
  if (typeof fee === "string" && fee.trim()) {
    const parsed = Number(fee);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

export const TRAIN_BOOK_SUBMIT_CONFIRM_MESSAGE =
  "提交订单后暂未完成出票，请在订单详情中确认座位信息，确认无误后，提交完成出票，过期不确认提交将自动取消订单";

export const TRAIN_EXCHANGE_SUBMIT_CONFIRM_MESSAGE =
  "改签提交订单后暂未完成出票，请在订单详情中确认座位信息，确认无误后，点击确认出票，过期不确认出票将自动取消订单";

/** Legacy tmc-train-book_ryx: confirm before submit when auto-issue is forbidden. */
export function shouldConfirmTrainBookBeforeSubmit(input: {
  init: TrainInitBookResponse | undefined;
  isExchangeBook: boolean;
  travelPayType: number | null | undefined;
}): boolean {
  if (input.isExchangeBook) return true;

  const tmc = input.init?.Tmc as { TrainIsForbidAutoIssue?: boolean } | undefined;
  if (!tmc?.TrainIsForbidAutoIssue) return false;

  const payType = input.travelPayType;
  return payType === TRAIN_PAY_TYPE_COMPANY || payType === TRAIN_PAY_TYPE_PERSON;
}

export function resolveTrainSubmitConfirmMessage(isExchangeBook: boolean): string {
  return isExchangeBook ? TRAIN_EXCHANGE_SUBMIT_CONFIRM_MESSAGE : TRAIN_BOOK_SUBMIT_CONFIRM_MESSAGE;
}
