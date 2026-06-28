import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  FlightAbolishTicketParams,
  FlightCancelParams,
  FlightNonVoluntaryRefundParams,
  FlightRefundParams,
  FlightTicketRefundInfoParams,
} from "@ryx/shared-types";

import { getApi } from "@/lib/api";
import {
  coerceFlightOrderDetail,
  resolvePayHoldSeconds,
  shouldPollFlightOrderDetail,
} from "@/lib/flight-order-detail";

export function useFlightOrderDetail(orderId: string) {
  return useQuery({
    queryKey: ["order", "detail", orderId],
    queryFn: async () => {
      const data = await getApi().order.getDetail({ OrderId: orderId });
      return coerceFlightOrderDetail(data);
    },
    enabled: Boolean(orderId),
    refetchInterval: (query) => {
      const detail = query.state.data;
      if (!shouldPollFlightOrderDetail(detail)) {
        return false;
      }
      return 3000;
    },
  });
}

export function useCancelFlightOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      mode: "order" | "ticket";
      params: FlightCancelParams | FlightAbolishTicketParams;
    }) => {
      if (input.mode === "ticket") {
        return getApi().order.abolishFlightTicket(input.params as FlightAbolishTicketParams);
      }
      return getApi().order.cancelFlight(input.params as FlightCancelParams);
    },
    onSuccess: (_data, variables) => {
      const orderId = variables.params.OrderId;
      void queryClient.invalidateQueries({ queryKey: ["order", "detail", orderId] });
      void queryClient.invalidateQueries({ queryKey: ["order", "list"] });
    },
  });
}

export function useFlightTicketRefundInfo(params: FlightTicketRefundInfoParams | null) {
  return useQuery({
    queryKey: ["order", "flight", "refundInfo", params?.orderFlightTicket],
    queryFn: () => getApi().order.getFlightTicketRefundInfo(params!),
    enabled: Boolean(params?.orderFlightTicket),
    retry: false,
  });
}

export function useRefundFlightOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: FlightRefundParams) => getApi().order.refundFlight(params),
    onSuccess: async (_data, variables) => {
      await queryClient.refetchQueries({
        queryKey: ["order", "detail", variables.orderId],
        type: "active",
      });
      void queryClient.invalidateQueries({ queryKey: ["order", "list"] });
    },
  });
}

export function useNonVoluntaryRefundFlightOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: FlightNonVoluntaryRefundParams) =>
      getApi().order.nonVoluntaryRefundFlight(params),
    onSuccess: async (_data, variables) => {
      await queryClient.refetchQueries({
        queryKey: ["order", "detail", variables.OrderId],
        type: "active",
      });
      void queryClient.invalidateQueries({ queryKey: ["order", "list"] });
    },
  });
}

export function useFlightPayHoldCountdown(payHoldMinutes?: number) {
  const initialSeconds = resolvePayHoldSeconds(payHoldMinutes);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(initialSeconds);

  useEffect(() => {
    setRemainingSeconds(resolvePayHoldSeconds(payHoldMinutes));
  }, [payHoldMinutes]);

  useEffect(() => {
    if (remainingSeconds == null || remainingSeconds <= 0) return undefined;
    const timer = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current == null || current <= 1) return 0;
        return Math.max(0, Math.floor(current) - 1);
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [remainingSeconds]);

  return remainingSeconds;
}
