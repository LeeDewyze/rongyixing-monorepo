import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import type {
  ProductChannel,
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

export function useTrainOrderDetail(orderId: string, channel?: ProductChannel) {
  return useQuery({
    queryKey: ["order", "detail", orderId, channel],
    queryFn: async () => {
      const data = await getApi().order.getDetail({ OrderId: orderId, channel });
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

async function refreshTrainOrderDetailAfterMutation(queryClient: QueryClient, orderId: string) {
  await queryClient.refetchQueries({ queryKey: ["order", "detail", orderId], type: "active" });
  void queryClient.invalidateQueries({ queryKey: ["order", "list"] });
}

export function useCancelTrainOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: TrainCancelParams) => getApi().order.cancelTrain(params),
    onSuccess: async (_data, variables) => {
      await refreshTrainOrderDetailAfterMutation(queryClient, variables.OrderId);
    },
  });
}

export function useIssueTrainOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: TrainIssueParams) => getApi().order.issueTrain(params),
    onSuccess: async (_data, variables) => {
      await refreshTrainOrderDetailAfterMutation(queryClient, variables.OrderId);
    },
  });
}

export function useRefundTrainOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: TrainRefundParams) => getApi().order.refundTrain(params),
    onSuccess: async (_data, variables) => {
      await refreshTrainOrderDetailAfterMutation(queryClient, variables.OrderId);
    },
  });
}

export function useTrainPayHoldCountdown(payHoldMinutes?: number) {
  return useFlightPayHoldCountdown(payHoldMinutes);
}

export { resolvePayHoldSeconds };
