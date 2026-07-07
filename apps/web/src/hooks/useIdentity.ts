import { useQuery } from "@tanstack/react-query";

import { getApi } from "@/lib/api";
import { getApiMode } from "@/lib/env";
import { getTicket } from "@/lib/session";

/** Legacy `identityService.getIdentityAsync()` for agent-only features such as save order. */
export function useIdentity() {
  const enabled = getApiMode() === "mock" || Boolean(getTicket());
  return useQuery({
    queryKey: ["identity"],
    queryFn: () => getApi().identity.get(),
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
