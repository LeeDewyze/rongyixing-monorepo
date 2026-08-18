import { useCallback, useMemo } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  HotelCity,
  HotelDetailParams,
  HotelKeywordSearchParams,
  HotelListParams,
  HotelPolicyParams,
} from "@ryx/shared-types";
import { readResourceCache, writeResourceCache } from "@ryx/api";

import { getApi } from "@/lib/api";

export const HOTEL_LIST_PAGE_SIZE = 20;

export const hotelListQueryKey = (params: HotelListParams) => ["hotel", "list", params] as const;

const HOTEL_CITY_CACHE_KEY = "ryx:web:resource:domestic-hotel-cities:v1";
const RESOURCE_STALE_TIME = 24 * 60 * 60 * 1000;
const RESOURCE_GC_TIME = 7 * 24 * 60 * 60 * 1000;

export function useHotelList(params: HotelListParams = {}, enabled = true) {
  const hasRequired = Boolean(params.CityCode && params.CheckInDate && params.CheckOutDate);
  return useQuery({
    queryKey: hotelListQueryKey(params),
    queryFn: () => getApi().hotel.getList(params),
    enabled: enabled && hasRequired,
  });
}

function getNextHotelPageIndex(
  hotels: unknown[] | undefined,
  totalCount: number | undefined,
  pageParam: number,
): number | undefined {
  const pageHotels = hotels ?? [];
  if (typeof totalCount === "number") {
    const loadedCount = pageParam * HOTEL_LIST_PAGE_SIZE + pageHotels.length;
    return loadedCount < totalCount ? pageParam + 1 : undefined;
  }
  if (pageHotels.length < HOTEL_LIST_PAGE_SIZE) return undefined;
  return pageParam + 1;
}

export function useInfiniteHotelList(params: HotelListParams = {}, enabled = true) {
  const queryClient = useQueryClient();
  const hasRequired = Boolean(params.CityCode && params.CheckInDate && params.CheckOutDate);
  const baseParams = useMemo(
    () => ({ ...params, PageSize: params.PageSize ?? HOTEL_LIST_PAGE_SIZE }),
    [params],
  );
  const queryKey = useMemo(() => hotelListQueryKey(baseParams), [baseParams]);

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 0 }) =>
      getApi().hotel.getList({
        ...baseParams,
        PageIndex: pageParam,
        PageSize: HOTEL_LIST_PAGE_SIZE,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, pageParam) =>
      getNextHotelPageIndex(lastPage?.Hotels, lastPage?.TotalCount, pageParam),
    enabled: enabled && hasRequired,
  });

  const refresh = useCallback(async () => {
    await queryClient.resetQueries({ queryKey, exact: true });
  }, [queryClient, queryKey]);

  return { ...query, refresh };
}

export function useHotelDetail(params: HotelDetailParams | null) {
  return useQuery({
    queryKey: ["hotel", "detail", params],
    queryFn: () => getApi().hotel.getDetail(params!),
    enabled: Boolean(
      params?.HotelId && params.CheckInDate && params.CheckOutDate && params.CityCode,
    ),
  });
}

export function useHotelPolicy(params: HotelPolicyParams | null, enabled = true) {
  return useQuery({
    queryKey: ["hotel", "policy", params],
    queryFn: () => getApi().hotel.getPolicy(params!),
    enabled: enabled && Boolean(params?.RoomPlans && params.Passengers && params.CityCode),
  });
}

export function useHotelCities() {
  const cached = readResourceCache<HotelCity[]>(HOTEL_CITY_CACHE_KEY);
  return useQuery({
    queryKey: ["hotel", "cities"],
    queryFn: async () => {
      const cities = await getApi().hotel.getCities();
      writeResourceCache(HOTEL_CITY_CACHE_KEY, cities);
      return cities;
    },
    initialData: cached?.data,
    initialDataUpdatedAt: cached?.updatedAt,
    staleTime: RESOURCE_STALE_TIME,
    gcTime: RESOURCE_GC_TIME,
  });
}

export function useHotelConditions(cityCode?: string, channel?: "tmc" | "tourist") {
  return useQuery({
    queryKey: ["hotel", "conditions", cityCode, channel],
    queryFn: () => getApi().hotel.getConditions({ CityCode: cityCode!, channel }),
    enabled: Boolean(cityCode),
  });
}

export function useHotelKeywordSearch(params: HotelKeywordSearchParams | null, enabled = true) {
  const keyword = params?.Keyword.trim() ?? "";
  return useQuery({
    queryKey: [
      "hotel",
      "keyword-search",
      params?.CityCode,
      params?.CityName,
      keyword,
      params?.channel,
    ],
    queryFn: () => getApi().hotel.searchHotel({ ...params!, Keyword: keyword }),
    enabled: enabled && Boolean(params?.CityCode && params.CityName && keyword),
  });
}
