import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { HotelBookParams, HotelOrderBookDto, ProductChannel } from "@ryx/shared-types";

import {
  HOTEL_BOOK_SELECTION_EVENT,
  loadHotelBookSelection,
  type HotelBookSelection,
} from "@/lib/hotel-book-session";
import { getApi } from "@/lib/api";

export { useOrderPays, usePayCreate, usePayProcess, usePayTotalAmount } from "./useOrderPay";

export function useHotelBookSelection() {
  const [selection, setSelectionState] = useState<HotelBookSelection | null>(() =>
    loadHotelBookSelection(),
  );

  useEffect(() => {
    function sync() {
      setSelectionState(loadHotelBookSelection());
    }
    window.addEventListener(HOTEL_BOOK_SELECTION_EVENT, sync);
    return () => window.removeEventListener(HOTEL_BOOK_SELECTION_EVENT, sync);
  }, []);

  const reload = useCallback(() => {
    setSelectionState(loadHotelBookSelection());
  }, []);

  return { selection, reload };
}

export function useHotelInitBook(params: HotelOrderBookDto | null) {
  return useQuery({
    queryKey: ["hotel", "initBook", params],
    queryFn: () => getApi().hotel.initBook(params!),
    enabled: Boolean(params?.Passengers?.length),
    staleTime: 0,
    retry: false,
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

export function useOrderDetail(orderId: string, pollMs = 3000, channel?: ProductChannel) {
  return useQuery({
    queryKey: ["order", "detail", orderId, channel],
    queryFn: () => getApi().order.getDetail({ OrderId: orderId, channel }),
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
