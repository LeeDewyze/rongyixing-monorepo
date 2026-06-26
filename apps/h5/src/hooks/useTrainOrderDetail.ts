import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  TrainCancelParams,
  TrainIssueParams,
  TrainRefundParams,
} from "@ryx/shared-types";

import { getApi } from "@/lib/api";
import {
  coerceTrainOrderDetail,
  resolvePayHoldSeconds,
  shouldPollTrainOrderDetail,
} from "@/lib/train-order-detail";
import { useFlightPayHoldCountdown } from "@/hooks/useFlightOrderDetail";

export function useTrainOrderDetail(orderId: string) {
  return useQuery({
    queryKey: ["order", "detail", orderId],
    queryFn: async () => {
      const data = await getApi().order.getDetail({ OrderId: orderId });
      return coerceTrainOrderDetail(data);
    },
    enabled: Boolean(orderId),
    refetchInterval: (query) => {
      const detail = query.state.data;
      if (!shouldPollTrainOrderDetail(detail)) {
        return false;
      }
      return 3000;
    },
  });
}

export function useCancelTrainOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: TrainCancelParams) => getApi().order.cancelTrain(params),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["order", "detail", variables.OrderId] });
      void queryClient.invalidateQueries({ queryKey: ["order", "list"] });
    },
  });
}

export function useIssueTrainOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: TrainIssueParams) => getApi().order.issueTrain(params),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["order", "detail", variables.OrderId] });
      void queryClient.invalidateQueries({ queryKey: ["order", "list"] });
    },
  });
}

export function useRefundTrainOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: TrainRefundParams) => getApi().order.refundTrain(params),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["order", "detail", variables.OrderId] });
      void queryClient.invalidateQueries({ queryKey: ["order", "list"] });
    },
  });
}

export function useTrainPayHoldCountdown(payHoldMinutes?: number) {
  return useFlightPayHoldCountdown(payHoldMinutes);
}

export { resolvePayHoldSeconds };
