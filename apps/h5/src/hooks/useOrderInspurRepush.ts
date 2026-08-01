import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  OrderRepushLinkmanSearchParams,
  OrderRepushParams,
  OrderRepushSubmitParams,
  ProductChannel,
} from "@ryx/shared-types";

import { getApi } from "@/lib/api";

export function useInspurRepush(orderId: string, channel?: ProductChannel, enabled = true) {
  const isTmc = channel === "tmc";
  return useQuery({
    queryKey: ["order", "inspurRepush", orderId, channel],
    queryFn: () => getApi().order.checkInspurRepush({ OrderId: orderId, channel }),
    enabled: Boolean(orderId) && isTmc && enabled,
    staleTime: 60_000,
  });
}

export function useInspurRepushPassengers(params: OrderRepushParams | null, enabled = true) {
  return useQuery({
    queryKey: ["order", "inspurRepush", "passengers", params?.OrderId, params?.channel],
    queryFn: () => getApi().order.getInspurRepushPassengers(params!),
    enabled: Boolean(params?.OrderId) && params?.channel === "tmc" && enabled,
  });
}

export function useInspurRepushLinkmans(
  params: OrderRepushLinkmanSearchParams | null,
  enabled = true,
) {
  return useQuery({
    queryKey: ["order", "inspurRepush", "linkmans", params?.name ?? "", params?.channel],
    queryFn: () => getApi().order.searchInspurRepushLinkmans(params ?? undefined),
    enabled: params?.channel === "tmc" && enabled,
    staleTime: 30_000,
  });
}

export function useSubmitInspurRepush() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: OrderRepushSubmitParams) => getApi().order.submitInspurRepush(params),
    onSuccess: async (_data, params) => {
      const orderId = params.Items[0]?.OrderId;
      if (!orderId) return;
      await queryClient.refetchQueries({
        queryKey: ["order", "inspurRepush", orderId],
        type: "active",
      });
      void queryClient.invalidateQueries({ queryKey: ["order", "detail", orderId] });
    },
  });
}
