import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getApi } from "@/lib/api";
import { getApiMode } from "@/lib/env";
import { formatApiError } from "@/lib/formatApiError";
import { isDingTalkContainer, isDingTalkEntryEnabled } from "@/lib/dingtalk";

export const DINGTALK_BINDINGS_QUERY_KEY = ["account", "dingtalk-bindings"] as const;

export function useDingTalkAvailability(entry: "login" | "bind") {
  const supported = isDingTalkContainer();
  const query = useQuery({
    queryKey: ["account", "dingtalk-enabled", entry],
    queryFn: () => isDingTalkEntryEnabled(entry),
    enabled: supported && getApiMode() !== "mock",
    staleTime: 5 * 60 * 1000,
  });
  return { supported, enabled: supported && (query.data ?? false), query };
}

export function useDingTalkBindings(enabled = true) {
  return useQuery({
    queryKey: DINGTALK_BINDINGS_QUERY_KEY,
    queryFn: () => getApi().dingtalk.list(),
    enabled,
  });
}

export function useBindDingTalk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => getApi().dingtalk.bind({ Code: code }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DINGTALK_BINDINGS_QUERY_KEY });
    },
  });
}

export function useRemoveDingTalk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => getApi().dingtalk.remove({ Id: id }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DINGTALK_BINDINGS_QUERY_KEY });
    },
  });
}

export function dingTalkErrorMessage(error: unknown): string {
  return formatApiError(error);
}
