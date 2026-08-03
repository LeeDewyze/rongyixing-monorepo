import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AccountCard, AccountCardFormValues } from "@ryx/shared-types";
import { accountCardFormToPayload } from "@ryx/shared-types";

import { getApi } from "@/lib/api";

export const accountCardQueryKey = ["account-card"] as const;

export function useAccountCards() {
  return useQuery({
    queryKey: accountCardQueryKey,
    queryFn: () => getApi().accountCard.list(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useSaveAccountCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: AccountCardFormValues) =>
      getApi().accountCard.save(accountCardFormToPayload(values)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: accountCardQueryKey });
    },
  });
}

export function useRemoveAccountCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (card: AccountCard) => {
      if (!card.Id) {
        throw new Error("请选择银行卡");
      }
      return getApi().accountCard.remove(card.Id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: accountCardQueryKey });
    },
  });
}
