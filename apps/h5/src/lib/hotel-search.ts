import type { HotelCity } from "@ryx/shared-types";

import { CITY_HISTORY_KEYS } from "./city-picker";
import { addDays, todayDateString } from "./date-search";

export const HOTEL_STORAGE_CITY = "ryx_hotel_city";
export const HOTEL_STORAGE_CHECK_IN = "ryx_hotel_checkIn";
export const HOTEL_STORAGE_CHECK_OUT = "ryx_hotel_checkOut";

export const DEFAULT_HOTEL_CITY: HotelCity = {
  Code: "010",
  Name: "北京",
  Pinyin: "beijing",
  IsHot: true,
};

export function displayHotelCity(city: HotelCity) {
  return city.Name;
}

export function loadStoredHotelCity(): HotelCity {
  try {
    const raw = localStorage.getItem(HOTEL_STORAGE_CITY);
    if (raw) {
      const parsed = JSON.parse(raw) as HotelCity;
      if (parsed?.Code) return parsed;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_HOTEL_CITY;
}

export function persistHotelSearch(city: HotelCity, checkIn: string, checkOut: string) {
  localStorage.setItem(HOTEL_STORAGE_CITY, JSON.stringify(city));
  localStorage.setItem(HOTEL_STORAGE_CHECK_IN, checkIn);
  localStorage.setItem(HOTEL_STORAGE_CHECK_OUT, checkOut);
}

export function loadDefaultHotelSearchForm() {
  const today = todayDateString();
  let checkIn = today;
  let checkOut = addDays(today, 1);
  try {
    const storedIn = localStorage.getItem(HOTEL_STORAGE_CHECK_IN);
    const storedOut = localStorage.getItem(HOTEL_STORAGE_CHECK_OUT);
    if (storedIn && storedIn >= today) checkIn = storedIn;
    if (storedOut && storedOut > checkIn) checkOut = storedOut;
  } catch {
    /* ignore */
  }
  return {
    city: loadStoredHotelCity(),
    checkIn,
    checkOut,
  };
}

export function buildHotelListSearchParams({
  city,
  checkIn,
  checkOut,
}: {
  city: HotelCity;
  checkIn: string;
  checkOut: string;
}): URLSearchParams {
  return new URLSearchParams({
    cityCode: city.Code,
    cityName: city.Name,
    checkIn,
    checkOut,
  });
}

export function validateHotelSearch(
  city: HotelCity | null | undefined,
  checkIn: string,
  checkOut: string,
): string | null {
  if (!city?.Code) return "请选择目的地";
  if (!checkIn) return "请选择入住日期";
  if (!checkOut) return "请选择离店日期";
  if (checkOut <= checkIn) return "离店日期须晚于入住日期";
  return null;
}

/** Match city labels from URL, storage, or defaults against the TMC catalog. */
function hotelCityNameMatches(city: HotelCity, label: string) {
  const normalized = label.trim();
  if (!normalized) return false;
  return city.Name === normalized || city.Nickname === normalized;
}

/**
 * Resolve a city against the API catalog. Upgrades legacy codes (e.g. mock `010`)
 * to the TMC code (e.g. `1101`) when names match.
 */
export function resolveHotelCityInCatalog(cities: HotelCity[], city: HotelCity): HotelCity {
  if (!cities.length) return city;

  const byCode = cities.find((c) => c.Code === city.Code);
  if (byCode) return byCode;

  const labels = [city.Name, city.Nickname].filter(Boolean) as string[];
  for (const label of labels) {
    const byName = cities.find((c) => hotelCityNameMatches(c, label));
    if (byName) return byName;
  }

  return city;
}

export function hotelCityFromQuery(cities: HotelCity[], code: string, name?: string): HotelCity {
  return resolveHotelCityInCatalog(cities, {
    Code: code,
    Name: name ?? code,
  });
}

export function toHotelPickerOptions(cities: HotelCity[]) {
  return cities.map((c) => ({
    id: c.Code,
    label: c.Name,
    sublabel: c.Code,
    searchText: [c.Name, c.Pinyin, c.Code].filter(Boolean).join(" "),
    hot: c.IsHot,
  }));
}

export const hotelCityPickerAdapter = {
  getId: (city: HotelCity) => city.Code,
  getCode: (city: HotelCity) => city.Code,
  getName: (city: HotelCity) => city.Name,
  getPinyin: (city: HotelCity) => city.Pinyin,
  getIsHot: (city: HotelCity) => Boolean(city.IsHot),
  getSequence: (city: HotelCity) => city.Sequence,
  getFirstLetter: (city: HotelCity) => {
    const letter = city.FirstLetter ?? city.Initial;
    if (letter) return letter.charAt(0).toUpperCase();
    return undefined;
  },
  getSearchValues: (city: HotelCity) =>
    [city.Code, city.Name, city.Nickname, city.Pinyin, city.Initial].filter(Boolean) as string[],
};

export { CITY_HISTORY_KEYS };
