import type { HotelInitBookResponse, PassengerBookInfo } from "@ryx/shared-types";

import { resolvePassengerServiceFee } from "@/lib/hotel-book";

export const HOTEL_PAY_TYPE_COMPANY = 1;
export const HOTEL_PAY_TYPE_PERSON = 2;

/** Legacy pay types not offered on ryx hotel book page. */
const HIDDEN_HOTEL_PAY_TYPE_LABEL_PATTERN = /^(实时扣款|信用付)/;

export interface HotelPayTypeOption {
  value: number;
  label: string;
}

const DEFAULT_PAY_OPTIONS: HotelPayTypeOption[] = [
  { value: HOTEL_PAY_TYPE_COMPANY, label: "公付" },
  { value: HOTEL_PAY_TYPE_PERSON, label: "个付（请在20分钟内完成支付）" },
];

export function isHiddenHotelPayTypeOption(option: HotelPayTypeOption): boolean {
  const coreLabel = option.label.replace(/（[^）]*）/g, "").trim();
  return HIDDEN_HOTEL_PAY_TYPE_LABEL_PATTERN.test(coreLabel);
}

export function parseHotelPayTypeOptions(
  payTypes: Record<string, string> | undefined,
): HotelPayTypeOption[] {
  const parsed =
    !payTypes || !Object.keys(payTypes).length
      ? DEFAULT_PAY_OPTIONS
      : Object.entries(payTypes)
          .map(([key, label]) => ({ value: Number(key), label }))
          .filter((item) => Number.isFinite(item.value) && item.label)
          .sort((a, b) => a.value - b.value);

  const visible = parsed.filter((item) => !isHiddenHotelPayTypeOption(item));
  return visible.length ? visible : DEFAULT_PAY_OPTIONS;
}

export function resolveDefaultHotelPayType(options: HotelPayTypeOption[]): number {
  return (
    options.find((item) => item.value === HOTEL_PAY_TYPE_COMPANY)?.value ??
    options[0]?.value ??
    HOTEL_PAY_TYPE_COMPANY
  );
}

export function resolveHotelHoldMinutes(init: HotelInitBookResponse | undefined): number {
  const tmc = init?.Tmc as { HotelHoldMinute?: number; FlightHoldMinute?: number } | undefined;
  const minute = tmc?.HotelHoldMinute ?? tmc?.FlightHoldMinute;
  if (typeof minute === "number" && minute > 0) return minute;
  return 20;
}

export function resolveHotelBookTmcFlags(init: HotelInitBookResponse | undefined): {
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
