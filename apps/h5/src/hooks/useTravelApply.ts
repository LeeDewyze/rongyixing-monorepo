import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getTicket } from "@/lib/session";
import {
  fetchTravelApplyMeta,
  modifyTravelApply,
  submitTravelApply,
  type TravelApplyFormValues,
  type TravelApplyMeta,
  type TravelApplySubmitOptions,
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
    mutationFn: ({
      values,
      submitForApproval,
    }: {
      values: TravelApplyFormValues;
      submitForApproval?: boolean;
    }) => {
      if (!meta) throw new Error("出差申请表单未加载完成");
      const options: TravelApplySubmitOptions = { submitForApproval };
      return submitTravelApply(meta, values, options);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["travel"] });
      void queryClient.invalidateQueries({ queryKey: ["approval"] });
    },
  });
}

export function useModifyTravelApply(meta: TravelApplyMeta | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      values,
      formId,
      submitForApproval,
    }: {
      values: TravelApplyFormValues;
      formId: string;
      submitForApproval?: boolean;
    }) => {
      if (!meta) throw new Error("出差申请表单未加载完成");
      const options: TravelApplySubmitOptions = { submitForApproval };
      return modifyTravelApply(meta, values, formId, options);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["travel"] });
      void queryClient.invalidateQueries({ queryKey: ["approval"] });
    },
  });
}
