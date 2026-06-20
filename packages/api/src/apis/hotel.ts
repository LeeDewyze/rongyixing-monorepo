import type {
  HotelBookParams,
  HotelBookResponse,
  HotelCity,
  HotelCityResourceResponse,
  HotelDetailParams,
  HotelDetailResponse,
  HotelInitBookParams,
  HotelInitBookResponse,
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
    getList(params) {
      return proxy.send<HotelListResponse>({
        method: HOTEL_FLOW_METHODS.LIST,
        data: params,
      });
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
