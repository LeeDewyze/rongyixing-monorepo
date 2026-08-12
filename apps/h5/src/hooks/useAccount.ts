import { useQuery } from "@tanstack/react-query";

import { getApi } from "@/lib/api";

export function useAccountBalance() {
  return useQuery({
    queryKey: ["member", "balance"],
    queryFn: () =>
      getApi()
        .member.getBalance()
        .catch(() => 0),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
