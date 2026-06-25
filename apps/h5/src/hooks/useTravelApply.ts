import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getTicket } from "@/lib/session";
import {
  fetchTravelApplyMeta,
  submitTravelApply,
  type TravelApplyFormValues,
  type TravelApplyMeta,
} from "@/lib/travel-apply";

export function useTravelApplyMeta() {
  const ticket = getTicket();
  return useQuery({
    queryKey: ["travel", "apply-meta", ticket],
    queryFn: () => fetchTravelApplyMeta(ticket!),
    enabled: Boolean(ticket),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useSubmitTravelApply(meta: TravelApplyMeta | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: TravelApplyFormValues) => {
      if (!meta) throw new Error("出差申请表单未加载完成");
      return submitTravelApply(meta, values);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["travel"] });
      void queryClient.invalidateQueries({ queryKey: ["approval"] });
    },
  });
}
