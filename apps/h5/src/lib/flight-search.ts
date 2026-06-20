import type { Trafficline } from "@ryx/shared-types";

import {
  buildDateRange,
  formatDateLabel,
  formatDayChip,
  todayDateString,
} from "./date-search";

export { buildDateRange, formatDayChip, todayDateString };

export const FLIGHT_STORAGE_FROM = "ryx_flight_fromCity";
export const FLIGHT_STORAGE_TO = "ryx_flight_toCity";

export const DEFAULT_FLIGHT_FROM: Trafficline = {
  Id: "9278",
  Tag: "AirportCity",
  Code: "BJS",
  Name: "北京",
  Nickname: "北京",
  CityName: "北京",
  CountryCode: "CN",
  IsHot: true,
};

export const DEFAULT_FLIGHT_TO: Trafficline = {
  Id: "9280",
  Tag: "AirportCity",
  Code: "SHA",
  Name: "上海",
  Nickname: "上海",
  CityName: "上海",
  CountryCode: "CN",
  IsHot: true,
};

export function displayCityName(city: Trafficline) {
  if (city.Tag === "Airport" && city.CityName) {
    return city.CityName.replace("国际", "").replace("机场", "");
  }
  return (city.Nickname ?? city.Name)
    .replace("国际", "")
    .replace("机场", "");
}

/** Browse / hot chip label — legacy getItem with isShowAirports=false. */
export function displayTrafficlineBrowseName(city: Trafficline) {
  const raw = city.IsHot
    ? (city.CityName ?? city.Nickname ?? city.Name)
    : (city.Nickname ?? city.Name);
  return raw.replace("国际", "").replace("机场", "");
}

/** Search result primary line — legacy tmc-flight-select-city list item. */
export function displayTrafficlineSearchName(city: Trafficline) {
  return city.Nickname ?? city.Name;
}

export function loadStoredCity(key: string, fallback: Trafficline): Trafficline {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as Trafficline;
      if (parsed?.Code) return parsed;
    }
  } catch {
    /* ignore */
  }
  return fallback;
}

export function persistFlightCities(fromCity: Trafficline, toCity: Trafficline) {
  localStorage.setItem(FLIGHT_STORAGE_FROM, JSON.stringify(fromCity));
  localStorage.setItem(FLIGHT_STORAGE_TO, JSON.stringify(toCity));
}

export function resolveCityFromAirports(
  code: string,
  name: string | undefined,
  airports: Trafficline[],
  fallback: Trafficline,
): Trafficline {
  const found = airports.find((c) => c.Code === code);
  if (found) return found;
  if (!code) return fallback;
  return {
    ...fallback,
    Id: code,
    Code: code,
    Name: name ?? code,
    Nickname: name ?? code,
    CityName: name ?? code,
  };
}

export interface FlightListQueryInput {
  fromCity: Trafficline;
  toCity: Trafficline;
  date: string;
}

export function buildFlightListSearchParams({
  fromCity,
  toCity,
  date,
}: FlightListQueryInput): URLSearchParams {
  return new URLSearchParams({
    fromCode: fromCity.Code,
    toCode: toCity.Code,
    fromName: displayCityName(fromCity),
    toName: displayCityName(toCity),
    date,
    fromAsAirport: String(fromCity.Tag === "Airport"),
    toAsAirport: String(toCity.Tag === "Airport"),
  });
}

export function formatFlightDateLabel(dateStr: string) {
  return formatDateLabel(dateStr);
}

export interface FlightSearchQueryInitial {
  fromCode: string;
  toCode: string;
  fromName?: string;
  toName?: string;
  date: string;
  fromAsAirport?: boolean;
  toAsAirport?: boolean;
}

export function cityFromQuery(
  airports: Trafficline[],
  code: string,
  name: string | undefined,
  asAirport: boolean | undefined,
): Trafficline {
  const resolved = resolveCityFromAirports(code, name, airports, {
    Id: code,
    Tag: asAirport ? "Airport" : "AirportCity",
    Code: code,
    Name: name ?? code,
    Nickname: name ?? code,
  });
  if (asAirport && resolved.Tag !== "Airport") {
    return { ...resolved, Tag: "Airport" };
  }
  return resolved;
}

export function loadDefaultSearchForm(): {
  fromCity: Trafficline;
  toCity: Trafficline;
  date: string;
} {
  return {
    fromCity: loadStoredCity(FLIGHT_STORAGE_FROM, DEFAULT_FLIGHT_FROM),
    toCity: loadStoredCity(FLIGHT_STORAGE_TO, DEFAULT_FLIGHT_TO),
    date: todayDateString(),
  };
}

export function validateFlightSearch(
  fromCity: Trafficline | null | undefined,
  toCity: Trafficline | null | undefined,
): string | null {
  if (!fromCity?.Code) return "请选择出发地";
  if (!toCity?.Code) return "请选择目的地";
  if (fromCity.Code === toCity.Code) return "出发地和目的地不能相同";
  return null;
}
