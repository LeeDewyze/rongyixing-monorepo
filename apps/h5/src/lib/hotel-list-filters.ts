import type { HotelListParams } from "@ryx/shared-types";

export type HotelListSortOrder = "" | "PriceAsc" | "PriceDesc" | "CategoryAsc" | "CategoryDesc";
export type HotelListFilterSection =
  | "sort"
  | "star"
  | "category"
  | "price"
  | "location"
  | "brand"
  | "theme"
  | "service"
  | "facility";

export interface HotelListPriceRange {
  id: string;
  label: string;
  begin?: number;
  end?: number;
}

export interface HotelListFilterState {
  orderby: HotelListSortOrder;
  stars: number[];
  categories: string[];
  priceRangeId: string;
  customBeginPrice: string;
  customEndPrice: string;
  geoGroup: string;
  geos: string[];
  brands: string[];
  themes: string[];
  services: string[];
  facilities: string[];
}

export const HOTEL_LIST_SORT_OPTIONS: { id: HotelListSortOrder; label: string }[] = [
  { id: "", label: "推荐排序" },
  { id: "PriceAsc", label: "低价优先" },
  { id: "PriceDesc", label: "高价优先" },
  { id: "CategoryAsc", label: "星级升序" },
  { id: "CategoryDesc", label: "星级倒序" },
];

export const HOTEL_LIST_STAR_OPTIONS = [
  { id: 3, label: "三星/舒适" },
  { id: 4, label: "四星/高档" },
  { id: 5, label: "五星/豪华" },
];

export const HOTEL_LIST_CATEGORY_OPTIONS = [
  { id: "Tmc", label: "协议酒店" },
  { id: "GreenCloud", label: "旅发酒店" },
];

export const HOTEL_LIST_PRICE_RANGES: HotelListPriceRange[] = [
  { id: "", label: "不限" },
  { id: "0-150", label: "150以下", begin: 0, end: 150 },
  { id: "150-300", label: "150-300", begin: 150, end: 300 },
  { id: "300-450", label: "300-450", begin: 300, end: 450 },
  { id: "450-600", label: "450-600", begin: 450, end: 600 },
  { id: "600+", label: "600以上", begin: 600, end: 10000000 },
];

export function createInitialHotelListFilter(): HotelListFilterState {
  return {
    orderby: "",
    stars: [],
    categories: [],
    priceRangeId: "",
    customBeginPrice: "",
    customEndPrice: "",
    geoGroup: "",
    geos: [],
    brands: [],
    themes: [],
    services: [],
    facilities: [],
  };
}

export function isHotelListFilterActive(filter: HotelListFilterState): boolean {
  return Boolean(
    filter.orderby ||
      filter.stars.length ||
      filter.categories.length ||
      filter.priceRangeId ||
      filter.customBeginPrice.trim() ||
      filter.customEndPrice.trim() ||
      filter.geos.length ||
      filter.brands.length ||
      filter.themes.length ||
      filter.services.length ||
      filter.facilities.length,
  );
}

export function isHotelListFilterSectionActive(
  filter: HotelListFilterState,
  section: HotelListFilterSection,
): boolean {
  if (section === "sort") return Boolean(filter.orderby);
  if (section === "star") return filter.stars.length > 0;
  if (section === "category") return filter.categories.length > 0;
  if (section === "price") {
    return Boolean(
    filter.priceRangeId || filter.customBeginPrice.trim() || filter.customEndPrice.trim(),
  );
  }
  if (section === "location") return filter.geos.length > 0;
  if (section === "brand") return filter.brands.length > 0;
  if (section === "theme") return filter.themes.length > 0;
  if (section === "service") return filter.services.length > 0;
  return filter.facilities.length > 0;
}

function normalizePriceInput(value: string): number | undefined {
  const text = value.trim();
  if (!text) return undefined;
  const parsed = Number.parseInt(text, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return parsed;
}

export function applyHotelListFilterParams(
  params: HotelListParams,
  filter: HotelListFilterState,
): HotelListParams {
  const next: HotelListParams = { ...params };

  if (filter.orderby) {
    next.Orderby = filter.orderby;
  }

  const categories = [...filter.stars.map(String), ...filter.categories];
  if (categories.length > 0) {
    next.Categories = categories;
  }
  if (filter.geos.length > 0) {
    next.Geos = filter.geos;
    next.searchGeoId = filter.geos[0];
  }
  if (filter.brands.length > 0) {
    next.Brands = filter.brands;
  }
  if (filter.themes.length > 0) {
    next.Themes = filter.themes;
  }
  if (filter.services.length > 0) {
    next.Services = filter.services;
  }
  if (filter.facilities.length > 0) {
    next.Facilities = filter.facilities;
  }

  const customBegin = normalizePriceInput(filter.customBeginPrice);
  const customEnd = normalizePriceInput(filter.customEndPrice);
  if (customBegin != null || customEnd != null) {
    next.BeginPrice = customBegin ?? 0;
    next.EndPrice = customEnd ?? 10000000;
    return next;
  }

  const selectedRange = HOTEL_LIST_PRICE_RANGES.find((range) => range.id === filter.priceRangeId);
  if (selectedRange?.id) {
    next.BeginPrice = selectedRange.begin ?? 0;
    next.EndPrice = selectedRange.end ?? 10000000;
  }

  return next;
}
