import { useQuery } from "@tanstack/react-query";
import type { HotelListParams } from "@ryx/shared-types";

import { getApi } from "@/lib/api";

export function useHotelList(params: HotelListParams = {}) {
  return useQuery({
    queryKey: ["hotel", "list", params],
    queryFn: () => getApi().hotel.getList(params),
  });
}

export function useHotelDetail(hotelId: string, checkIn?: string, checkOut?: string) {
  return useQuery({
    queryKey: ["hotel", "detail", hotelId, checkIn, checkOut],
    queryFn: () =>
      getApi().hotel.getDetail({
        HotelId: hotelId,
        CheckInDate: checkIn,
        CheckOutDate: checkOut,
      }),
    enabled: Boolean(hotelId),
  });
}

export function useHotelCities() {
  return useQuery({
    queryKey: ["hotel", "cities"],
    queryFn: () => getApi().hotel.getCities(),
  });
}
