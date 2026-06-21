import type { FlightSearchParams, Trafficline } from "@ryx/shared-types";

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
  AirportCityCode: "BJS",
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
  AirportCityCode: "SHA",
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

/** Legacy: Tag=Airport → airport code; Tag=AirportCity → AirportCityCode. */
export function isFlightAirportQuery(city: Trafficline): boolean {
  return city.Tag === "Airport";
}

/** Resolve Home-Index FromCode/ToCode (matches beeant setSearchFlightModelSource). */
export function resolveFlightLocationCode(city: Trafficline): string {
  if (isFlightAirportQuery(city)) {
    return city.Code;
  }
  return city.AirportCityCode || city.Code;
}

export function resolveCityFromAirports(
  code: string,
  name: string | undefined,
  airports: Trafficline[],
  fallback: Trafficline,
  asAirport?: boolean,
): Trafficline {
  if (asAirport === true) {
    const airport = airports.find((c) => c.Tag === "Airport" && c.Code === code);
    if (airport) return airport;
  } else if (asAirport === false) {
    const city = airports.find(
      (c) =>
        c.Tag === "AirportCity" &&
        (c.Code === code || c.AirportCityCode === code),
    );
    if (city) return city;
  }

  const found =
    airports.find((c) => c.Code === code) ??
    airports.find((c) => c.AirportCityCode === code);
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

/** Build TmcApiFlightUrl-Home-Index payload from selected cities. */
export function buildHomeIndexParams(
  fromCity: Trafficline,
  toCity: Trafficline,
  date: string,
): FlightSearchParams {
  const fromAsAirport = isFlightAirportQuery(fromCity);
  const toAsAirport = isFlightAirportQuery(toCity);
  return {
    Date: date,
    FromCode: resolveFlightLocationCode(fromCity),
    ToCode: resolveFlightLocationCode(toCity),
    FromAsAirport: fromAsAirport,
    ToAsAirport: toAsAirport,
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
  const fromAsAirport = isFlightAirportQuery(fromCity);
  const toAsAirport = isFlightAirportQuery(toCity);
  return new URLSearchParams({
    fromCode: resolveFlightLocationCode(fromCity),
    toCode: resolveFlightLocationCode(toCity),
    fromName: displayCityName(fromCity),
    toName: displayCityName(toCity),
    date,
    fromAsAirport: String(fromAsAirport),
    toAsAirport: String(toAsAirport),
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

/** Resolve list/search cities from URL query — avoids localStorage race on list page load. */
export function resolveListCitiesFromQuery(
  airports: Trafficline[],
  query: FlightSearchQueryInitial,
): { fromCity: Trafficline; toCity: Trafficline } | null {
  if (!airports.length || !query.fromCode || !query.toCode) {
    return null;
  }
  return {
    fromCity: cityFromQuery(
      airports,
      query.fromCode,
      query.fromName,
      query.fromAsAirport,
    ),
    toCity: cityFromQuery(
      airports,
      query.toCode,
      query.toName,
      query.toAsAirport,
    ),
  };
}

export function cityFromQuery(
  airports: Trafficline[],
  code: string,
  name: string | undefined,
  asAirport: boolean | undefined,
): Trafficline {
  const fallback: Trafficline = {
    Id: code,
    Tag: asAirport ? "Airport" : "AirportCity",
    Code: code,
    Name: name ?? code,
    Nickname: name ?? code,
  };

  if (name) {
    const cityByName = airports.find(
      (c) =>
        c.Tag === "AirportCity" &&
        (c.Name === name || c.Nickname === name || c.CityName === name),
    );
    if (cityByName) {
      return cityByName;
    }

    const airportByName = airports.find(
      (c) => c.Tag === "Airport" && (c.Name === name || c.Nickname === name),
    );
    if (airportByName) {
      return airportByName;
    }
  }

  return resolveCityFromAirports(code, name, airports, fallback, asAirport);
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
