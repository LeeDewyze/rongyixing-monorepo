import { useQuery } from "@tanstack/react-query";
import type { PassengerCredential } from "@ryx/shared-types";

import { getApi } from "@/lib/api";
import { getLoginUserId } from "@/lib/session";

export function useCredentialList() {
  const accountId = getLoginUserId();
  return useQuery({
    queryKey: ["credential", "self", accountId],
    queryFn: async (): Promise<PassengerCredential[]> => {
      if (!accountId) return [];
      const res = await getApi().proxy.send<PassengerCredential[] | { Credentials?: PassengerCredential[] }>({
        method: "TmcApiHomeUrl-Credentials-List",
        data: { accountId },
      });
      return Array.isArray(res) ? res : res?.Credentials ?? [];
    },
    enabled: Boolean(accountId),
    staleTime: 2 * 60 * 1000,
  });
}
