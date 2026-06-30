import { useCallback, useMemo } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  HotelDetailParams,
  HotelKeywordSearchParams,
  HotelListParams,
  HotelPolicyParams,
} from "@ryx/shared-types";

import { getApi } from "@/lib/api";

export const HOTEL_LIST_PAGE_SIZE = 20;

export const hotelListQueryKey = (params: HotelListParams) => ["hotel", "list", params] as const;

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
  if (totalCount != null) {
    const loaded = (pageParam + 1) * HOTEL_LIST_PAGE_SIZE;
    return loaded < totalCount ? pageParam + 1 : undefined;
  }
  return pageHotels.length >= HOTEL_LIST_PAGE_SIZE ? pageParam + 1 : undefined;
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
  return useQuery({
    queryKey: ["hotel", "cities"],
    queryFn: () => getApi().hotel.getCities(),
  });
}

export function useHotelConditions(cityCode?: string) {
  return useQuery({
    queryKey: ["hotel", "conditions", cityCode],
    queryFn: () => getApi().hotel.getConditions({ CityCode: cityCode! }),
    enabled: Boolean(cityCode),
  });
}

export function useHotelKeywordSearch(params: HotelKeywordSearchParams | null, enabled = true) {
  const keyword = params?.Keyword.trim() ?? "";
  return useQuery({
    queryKey: ["hotel", "keyword-search", params?.CityCode, params?.CityName, keyword],
    queryFn: () => getApi().hotel.searchHotel({ ...params!, Keyword: keyword }),
    enabled: enabled && Boolean(params?.CityCode && params.CityName && keyword),
  });
}
