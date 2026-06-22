import type {
  HotelBookParams,
  HotelBookResponse,
  HotelCity,
  HotelCityResourceResponse,
  HotelDetailParams,
  HotelDetailResponse,
  HotelInitBookParams,
  HotelInitBookResponse,
  HotelListItem,
  HotelListParams,
  HotelListResponse,
  HotelPolicyParams,
  HotelPolicyResponse,
} from "@ryx/shared-types";

import { HOTEL_FLOW_METHODS } from "../methods/hotel-flow.js";
import { TMC_METHODS } from "../methods/tmc.js";
import type { ProxyClient } from "../proxy/proxy-client.js";

export interface HotelApi {
  getCities(): Promise<HotelCity[]>;
  getList(params: HotelListParams): Promise<HotelListResponse>;
  getDetail(params: HotelDetailParams): Promise<HotelDetailResponse>;
  getPolicy(params: HotelPolicyParams): Promise<HotelPolicyResponse>;
  initBook(params: HotelInitBookParams): Promise<HotelInitBookResponse>;
  submitBook(params: HotelBookParams): Promise<HotelBookResponse>;
}

type HotelCityLine = HotelCity & {
  CityName?: string;
};

type LegacyHotelEntity = {
  Id?: string;
  Name?: string;
  Address?: string;
  Category?: string | number;
  AvgPrice?: number | string;
  Variables?: unknown;
  VariablesObj?: Record<string, unknown>;
  FileName?: string;
  FullFileName?: string;
  Tag?: string;
};

type LegacyHotelDayPrice = {
  Hotel?: LegacyHotelEntity;
  MinPrice?: number | string;
  AvgPrice?: number | string;
};

function toPrice(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const n = typeof value === "number" ? value : Number.parseFloat(String(value));
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function parseVariablesObject(variables: unknown): Record<string, unknown> | undefined {
  let current: unknown = variables;
  for (let depth = 0; depth < 2; depth += 1) {
    if (!current) return undefined;
    if (typeof current === "object") return current as Record<string, unknown>;
    if (typeof current !== "string") return undefined;
    try {
      current = JSON.parse(current) as unknown;
    } catch {
      return undefined;
    }
  }
  return typeof current === "object" && current != null
    ? (current as Record<string, unknown>)
    : undefined;
}

/** Legacy getAvgPrice: VariablesObj.AvgPrice only. */
function getHotelVariablesAvgPrice(hotel: LegacyHotelEntity): number | undefined {
  const vars = hotel.VariablesObj ?? parseVariablesObject(hotel.Variables);
  if (!vars) return undefined;
  return toPrice(vars.AvgPrice ?? vars.avgPrice);
}

function parseHotelListPrice(item: LegacyHotelDayPrice): number | undefined {
  const hotel = item.Hotel ?? {};
  // Item AvgPrice matches legacy goToDetail(hotelprice: item.AvgPrice) and is the
  // authoritative list quote when present; Variables/hotel.AvgPrice are fallbacks.
  return toPrice(item.AvgPrice) ?? getHotelVariablesAvgPrice(hotel) ?? toPrice(hotel.AvgPrice);
}

function parseHotelStar(category: string | number | undefined): number | undefined {
  if (category == null || category === "") return undefined;
  const value = typeof category === "number" ? category : Number.parseFloat(String(category));
  if (!Number.isFinite(value) || value <= 0) return undefined;
  if (value >= 5) return 5;
  return Math.round(value);
}

function mapLegacyHotelDayPrice(item: LegacyHotelDayPrice): HotelListItem | null {
  const hotel = item.Hotel;
  if (!hotel?.Id && !hotel?.Name) return null;
  const tags = hotel.Tag
    ? hotel.Tag.split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : undefined;
  return {
    HotelId: hotel.Id ?? "",
    HotelName: hotel.Name ?? "",
    Address: hotel.Address,
    Star: parseHotelStar(hotel.Category),
    MinPrice: parseHotelListPrice(item),
    ImageUrl: hotel.FullFileName ?? hotel.FileName,
    Tags: tags,
  };
}

function normalizeHotelListResponse(res: unknown): HotelListResponse {
  if (!res || typeof res !== "object") {
    return { Hotels: [] };
  }
  const payload = res as Record<string, unknown>;
  if (Array.isArray(payload.Hotels)) {
    return payload as unknown as HotelListResponse;
  }
  const legacyItems = payload.HotelSearchResultDtoList ?? payload.HotelDayPrices;
  if (Array.isArray(legacyItems)) {
    const hotels = (legacyItems as LegacyHotelDayPrice[])
      .map(mapLegacyHotelDayPrice)
      .filter((item): item is HotelListItem => Boolean(item?.HotelId && item.HotelName));
    const total =
      typeof payload.DataCount === "number"
        ? payload.DataCount
        : typeof payload.TotalCount === "number"
          ? payload.TotalCount
          : hotels.length;
    return { Hotels: hotels, TotalCount: total };
  }
  return { Hotels: [] };
}

function buildHotelListRequest(params: HotelListParams): Record<string, unknown> {
  const data: Record<string, unknown> = {
    CityCode: params.CityCode,
    BeginDate: params.CheckInDate,
    EndDate: params.CheckOutDate,
    PageIndex: params.PageIndex ?? 0,
    PageSize: params.PageSize ?? 10,
    IsLoadDetail: true,
    hotelType: params.HotelType ?? "Normal",
    Stars: null,
    Passengers: "",
  };
  const cityName = params.CityName?.trim();
  if (cityName) {
    data.CityName = cityName;
  }
  const keyword = params.Keyword?.trim();
  if (keyword) {
    data.SearchKey = keyword;
  }
  return data;
}

function normalizeHotelCities(
  res: HotelCity[] | HotelCityResourceResponse | null | undefined,
): HotelCity[] {
  const raw = Array.isArray(res)
    ? res
    : (res?.Trafficlines ?? res?.TrafficLines ?? res?.HotelCities ?? []);

  return raw
    .map((item) => {
      const line = item as HotelCityLine;
      const name = line.Name ?? line.Nickname ?? line.CityName ?? "";
      return {
        Code: line.Code,
        Name: name,
        Nickname: line.Nickname,
        Pinyin: line.Pinyin,
        Initial: line.Initial,
        FirstLetter: line.FirstLetter,
        IsHot: line.IsHot,
        Sequence: line.Sequence,
      } satisfies HotelCity;
    })
    .filter((city) => Boolean(city.Code && city.Name));
}

export function createHotelApi(proxy: ProxyClient): HotelApi {
  return {
    async getCities() {
      const res = await proxy.send<HotelCity[] | HotelCityResourceResponse>({
        method: TMC_METHODS.RESOURCE_DOMESTICHOTELCITY,
        data: {},
      });
      return normalizeHotelCities(res);
    },
    async getList(params) {
      const res = await proxy.send<unknown>({
        method: HOTEL_FLOW_METHODS.LIST,
        data: buildHotelListRequest(params),
      });
      return normalizeHotelListResponse(res);
    },
    getDetail(params) {
      return proxy.send<HotelDetailResponse>({
        method: HOTEL_FLOW_METHODS.DETAIL,
        data: params,
      });
    },
    getPolicy(params) {
      return proxy.send<HotelPolicyResponse>({
        method: HOTEL_FLOW_METHODS.POLICY,
        data: params,
      });
    },
    initBook(params) {
      return proxy.send<HotelInitBookResponse>({
        method: HOTEL_FLOW_METHODS.INIT,
        data: params,
        timeoutMs: 60_000,
      });
    },
    submitBook(params) {
      return proxy.send<HotelBookResponse>({
        method: HOTEL_FLOW_METHODS.BOOK,
        data: params,
        timeoutMs: 60_000,
      });
    },
  };
}
