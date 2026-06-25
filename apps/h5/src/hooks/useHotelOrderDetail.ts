import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { HotelCancelParams } from "@ryx/shared-types";

import { getApi } from "@/lib/api";

const TRANSITIONAL_STATUSES = new Set(["Booking", "WaitHandle", "WaitPay"]);

export function useHotelOrderDetail(orderId: string) {
  return useQuery({
    queryKey: ["order", "detail", orderId],
    queryFn: () => getApi().order.getDetail({ OrderId: orderId }),
    enabled: Boolean(orderId),
    refetchInterval: (query) => {
      const status = query.state.data?.Status;
      if (!status || !TRANSITIONAL_STATUSES.has(status)) {
        return false;
      }
      return 5000;
    },
  });
}

export function useCancelHotelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: HotelCancelParams) => getApi().order.cancelHotel(params),
    onSuccess: (_data, params) => {
      void queryClient.invalidateQueries({ queryKey: ["order", "detail", params.OrderId] });
      void queryClient.invalidateQueries({ queryKey: ["order", "list"] });
    },
  });
}

export function useHotelOrderSms() {
  const queryClient = useQueryClient();
  const send = useMutation({
    mutationFn: (params: { Mobile: string; OrderHotelId: string; orderId: string }) =>
      getApi().order.sendHotelOrderSmsCode({
        Mobile: params.Mobile,
        OrderHotelId: params.OrderHotelId,
      }),
    onSuccess: (_data, params) => {
      void queryClient.invalidateQueries({ queryKey: ["order", "detail", params.orderId] });
    },
  });
  const confirm = useMutation({
    mutationFn: (params: { SmsCode: string; OrderHotelId: string; orderId: string }) =>
      getApi().order.confirmHotelOrderSmsCode({
        SmsCode: params.SmsCode,
        OrderHotelId: params.OrderHotelId,
      }),
    onSuccess: (_data, params) => {
      void queryClient.invalidateQueries({ queryKey: ["order", "detail", params.orderId] });
    },
  });
  return { send, confirm };
}

export function useInspurRepush(orderId: string, enabled = true) {
  return useQuery({
    queryKey: ["order", "inspurRepush", orderId],
    queryFn: () => getApi().order.checkInspurRepush({ OrderId: orderId }),
    enabled: Boolean(orderId) && enabled,
    staleTime: 60_000,
  });
}
