import { useQuery } from "@tanstack/react-query";
import type { HotelDetailParams, HotelListParams, HotelPolicyParams } from "@ryx/shared-types";

import { getApi } from "@/lib/api";

export function useHotelList(params: HotelListParams = {}, enabled = true) {
  const hasRequired = Boolean(params.CityCode && params.CheckInDate && params.CheckOutDate);
  return useQuery({
    queryKey: ["hotel", "list", params],
    queryFn: () => getApi().hotel.getList(params),
    enabled: enabled && hasRequired,
  });
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
