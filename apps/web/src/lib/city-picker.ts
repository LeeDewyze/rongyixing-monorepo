/** Legacy-compatible localStorage keys for city/station history. */
export const CITY_HISTORY_KEYS = {
  flight: "historyDomesticAirports",
  hotel: "history_hotel_cities",
  train: "ryx_history_train_stations",
} as const;

export interface NormalizedPickerItem<T> {
  item: T;
  id: string;
  code: string;
  name: string;
  searchName: string;
  pinyin?: string;
  cityName?: string;
  firstLetter: string;
  isHot: boolean;
  isDeprecated: boolean;
  searchText: string;
}

export interface CityPickerAdapter<T> {
  getId: (item: T) => string;
  getCode: (item: T) => string;
  getName: (item: T) => string;
  getPinyin?: (item: T) => string | undefined;
  getCityName?: (item: T) => string | undefined;
  getIsHot?: (item: T) => boolean;
  getIsDeprecated?: (item: T) => boolean;
  getSearchValues?: (item: T) => string[];
  getFirstLetter?: (item: T) => string | undefined;
  getSequence?: (item: T) => number | undefined;
  getSearchName?: (item: T) => string;
}

function firstLetterFromPinyin(pinyin?: string): string {
  const ch = (pinyin ?? "").trim().charAt(0).toUpperCase();
  return ch >= "A" && ch <= "Z" ? ch : "#";
}

export function normalizePickerItems<T>(
  items: T[],
  adapter: CityPickerAdapter<T>,
): NormalizedPickerItem<T>[] {
  const list = Array.isArray(items) ? items : [];
  const normalized = list.map((item) => {
    const pinyin = adapter.getPinyin?.(item);
    const cityName = adapter.getCityName?.(item);
    const firstLetter =
      adapter.getFirstLetter?.(item) ?? firstLetterFromPinyin(pinyin);
    const searchValues =
      adapter.getSearchValues?.(item) ??
      [
        adapter.getCode(item),
        adapter.getName(item),
        pinyin,
        cityName,
      ].filter(Boolean);

    return {
      item,
      id: adapter.getId(item),
      code: adapter.getCode(item),
      name: adapter.getName(item),
      searchName: adapter.getSearchName?.(item) ?? adapter.getName(item),
      pinyin,
      cityName,
      firstLetter,
      isHot: adapter.getIsHot?.(item) ?? false,
      isDeprecated: adapter.getIsDeprecated?.(item) ?? false,
      searchText: searchValues.join(",").toLowerCase(),
    } satisfies NormalizedPickerItem<T>;
  });

  return normalized
    .filter((it) => !it.isDeprecated)
    .sort((a, b) => {
      const seqA = adapter.getSequence?.(a.item);
      const seqB = adapter.getSequence?.(b.item);
      if (seqA != null && seqB != null && seqA !== seqB) return seqA - seqB;
      if (a.isHot !== b.isHot) return a.isHot ? -1 : 1;
      return a.name.localeCompare(b.name, "zh-CN");
    });
}

export function groupByFirstLetter<T>(
  items: NormalizedPickerItem<T>[],
): { letters: string[]; groups: Record<string, NormalizedPickerItem<T>[]> } {
  const groups: Record<string, NormalizedPickerItem<T>[]> = {};
  for (const item of items) {
    const letter = item.firstLetter;
    if (!groups[letter]) groups[letter] = [];
    if (!groups[letter].some((it) => it.id === item.id)) {
      groups[letter].push(item);
    }
  }
  const letters = Object.keys(groups).sort((a, b) => {
    if (a === "#") return 1;
    if (b === "#") return -1;
    return a.localeCompare(b);
  });
  return { letters, groups };
}

/** Legacy keyword matching from tmc-flight-select-city / tmc-hotel-city. */
export function matchPickerKeyword(keyword: string, item: NormalizedPickerItem<unknown>): boolean {
  const name = keyword.trim().toLowerCase();
  if (!name) return true;

  if (name === "北京南苑") {
    return item.searchText.includes("北京") && !item.searchText.includes("南苑");
  }

  const isThreeLetterCode = /^[a-zA-Z]{3}$/.test(name);
  const fields = item.searchText.split(",");

  return fields.some((field) => {
    const n = field.trim();
    if (!n) return false;
    if (isThreeLetterCode) return n === name;
    return n === name || n.includes(name);
  });
}

export function filterPickerItems<T>(
  items: NormalizedPickerItem<T>[],
  keyword: string,
): NormalizedPickerItem<T>[] {
  const q = keyword.trim();
  if (!q) return items;
  return items.filter((item) => matchPickerKeyword(q, item as NormalizedPickerItem<unknown>));
}

export function loadCityHistory<T>(storageKey: string): T[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCityHistory<T>(storageKey: string, item: T, getId: (v: T) => string, max = 20): T[] {
  const prev = loadCityHistory<T>(storageKey);
  const next = [item, ...prev.filter((it) => getId(it) !== getId(item))].slice(0, max);
  localStorage.setItem(storageKey, JSON.stringify(next));
  return next;
}

export function clearCityHistory(storageKey: string): void {
  localStorage.removeItem(storageKey);
}

export const PICKER_PAGE_SIZE = 30;
