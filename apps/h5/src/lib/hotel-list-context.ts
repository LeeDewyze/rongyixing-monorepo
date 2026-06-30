import type { HotelType, PassengerBookInfo, TmcInfo } from "@ryx/shared-types";

const STAFF_CITY_STORAGE_KEYS = ["staffCityCode", "StaffCityCode", "ryx_staff_city_code"];

export function resolveHotelListPassengerIds(passengers: PassengerBookInfo[]): string {
  const ids = passengers
    .map((item) => {
      const fromPassenger =
        "AccountId" in item.passenger && item.passenger.AccountId
          ? String(item.passenger.AccountId)
          : "";
      const fromCredential = item.credential.AccountId ? String(item.credential.AccountId) : "";
      return fromPassenger || fromCredential || String(item.id ?? "");
    })
    .map((value) => value.trim())
    .filter(Boolean);

  return Array.from(new Set(ids)).join(",");
}

export function readStaffCityCode(): string | undefined {
  for (const key of STAFF_CITY_STORAGE_KEYS) {
    const value = localStorage.getItem(key)?.trim();
    if (value) return value;
  }
  return undefined;
}

export function shouldShowHotelFreeStayTip(input: {
  tmc?: TmcInfo;
  hotelType: HotelType;
}): boolean {
  const { tmc, hotelType } = input;
  if (!tmc || hotelType === "Agent") return false;
  return Boolean(
    tmc.AllowHotelOutPolicySelfPay ??
      tmc.AllowHotelExceedSelfPay ??
      tmc.IsHotelOutPolicySelfPay ??
      tmc.IsOpenHotelFreeStay,
  );
}

