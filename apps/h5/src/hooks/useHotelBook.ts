import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { HotelBookParams, HotelInitBookParams } from "@ryx/shared-types";

import { getApi } from "@/lib/api";

export { useOrderPays, usePayCreate, usePayProcess, usePayTotalAmount } from "./useOrderPay";

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

export function usePassengerList() {
  return useQuery({
    queryKey: ["passenger", "list"],
    queryFn: () => getApi().passenger.getPassengerList(),
  });
}

export function useTravelForms(travelType: "Hotel" | "Flight" | "Train" = "Hotel") {
  return useQuery({
    queryKey: ["travel", "forms", travelType],
    queryFn: () => getApi().travel.getTravelForms({ travelType }),
  });
}
