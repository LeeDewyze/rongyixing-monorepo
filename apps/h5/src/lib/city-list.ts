import type { TrafficlineDto } from "@ryx/shared-types";

export interface FlightCityOption {
  Code: string;
  Name: string;
  Nickname: string;
  Pinyin: string;
  FirstLetter: string;
  IsHot?: boolean;
  Sequence?: number;
}

export function deriveFirstLetter(pinyin: string): string {
  const trimmed = pinyin.trim();
  if (!trimmed) {
    return "#";
  }
  return trimmed.charAt(0).toUpperCase();
}

export function getCityFirstLetter(city: Pick<FlightCityOption, "FirstLetter" | "Pinyin">): string {
  const letter = city.FirstLetter?.trim();
  if (letter) {
    return letter;
  }
  return deriveFirstLetter(city.Pinyin);
}

/** Legacy beeant: sort by Sequence ascending, then hot cities before non-hot. */
export function sortFlightCitiesLikeLegacy(items: FlightCityOption[]): FlightCityOption[] {
  const sorted = [...items].sort((a, b) => (a.Sequence ?? 0) - (b.Sequence ?? 0));
  return [
    ...sorted.filter((item) => item.IsHot),
    ...sorted.filter((item) => !item.IsHot),
  ];
}

export function mapTrafficlineToCityOption(line: TrafficlineDto): FlightCityOption {
  const pinyin = line.Pinyin?.trim() ?? "";
  const displayName = line.IsHot
    ? line.CityName || line.Name || line.Nickname || line.Code
    : line.Nickname || line.Name || line.CityName || line.Code;

  return {
    Code: line.Code,
    Name: displayName,
    Nickname: line.Nickname || line.Name || displayName,
    Pinyin: pinyin,
    FirstLetter: line.FirstLetter?.trim() || deriveFirstLetter(pinyin),
    IsHot: line.IsHot,
    Sequence: line.Sequence,
  };
}

export function mapTrafficlinesToCityOptions(lines: TrafficlineDto[]): FlightCityOption[] {
  const options = lines
    .map(mapTrafficlineToCityOption)
    .filter((city) => Boolean(city.Name));
  return sortFlightCitiesLikeLegacy(options);
}

/** Group by letter while preserving legacy list order within each section. */
export function groupByFirstLetter(items: FlightCityOption[]): Record<string, FlightCityOption[]> {
  const groups: Record<string, FlightCityOption[]> = {};

  for (const item of sortFlightCitiesLikeLegacy(items)) {
    const letter = getCityFirstLetter(item);
    if (!groups[letter]) {
      groups[letter] = [];
    }
    groups[letter].push(item);
  }

  return groups;
}

export function filterCities(items: FlightCityOption[], keyword: string): FlightCityOption[] {
  const query = keyword.trim().toLowerCase();
  if (!query) {
    return items;
  }

  return items.filter((item) => {
    const fields = [item.Name, item.Nickname, item.Code, item.Pinyin];
    return fields.some((field) => field?.toLowerCase().includes(query));
  });
}

export function getAvailableLetters(groups: Record<string, FlightCityOption[]>): string[] {
  return Object.keys(groups).sort((a, b) => a.localeCompare(b, "en"));
}

export function splitHotCities(items: FlightCityOption[]): {
  hot: FlightCityOption[];
  all: FlightCityOption[];
} {
  const all = sortFlightCitiesLikeLegacy(items);
  return {
    hot: all.filter((item) => item.IsHot),
    all,
  };
}
