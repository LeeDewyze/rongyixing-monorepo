import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { HotelBookParams, HotelInitBookParams } from "@ryx/shared-types";

import { getApi } from "@/lib/api";

export function useHotelInitBook() {
  return useMutation({
    mutationFn: (params: HotelInitBookParams) => getApi().hotel.initBook(params),
  });
}

export function useHotelSubmitBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: HotelBookParams) => getApi().hotel.submitBook(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order"] });
    },
  });
}

export function useOrderDetail(orderId: string, pollMs = 3000) {
  return useQuery({
    queryKey: ["order", "detail", orderId],
    queryFn: () => getApi().order.getDetail({ OrderId: orderId }),
    enabled: Boolean(orderId),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.isShowPayButton) return false;
      return pollMs;
    },
  });
}

export function useOrderPays(orderId: string) {
  return useQuery({
    queryKey: ["pay", "channels", orderId],
    queryFn: () => getApi().pay.getOrderPays({ OrderId: orderId }),
    enabled: Boolean(orderId),
  });
}

export function usePayCreate() {
  return useMutation({
    mutationFn: (params: { OrderId: string; PayType: string; Amount?: number }) =>
      getApi().pay.create(params),
  });
}

export function usePassengerList() {
  return useQuery({
    queryKey: ["member", "passengers"],
    queryFn: () => getApi().member.getPassengerList(),
  });
}

export function useTravelForms(travelType: "Hotel" | "Flight" | "Train" = "Hotel") {
  return useQuery({
    queryKey: ["travel", "forms", travelType],
    queryFn: () => getApi().travel.getTravelForms({ travelType }),
  });
}
