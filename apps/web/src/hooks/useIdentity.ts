import { useQuery } from "@tanstack/react-query";

import { getApi } from "@/lib/api";
import { IDENTITY_QUERY_KEY } from "@/lib/booking-permission-preload";
import { getApiMode } from "@/lib/env";
import { getTicket } from "@/lib/session";

/** Legacy `identityService.getIdentityAsync()` for agent-only features such as save order. */
export function useIdentity() {
  const ticket = getTicket();
  const enabled = getApiMode() === "mock" || Boolean(ticket);
  return useQuery({
    queryKey: IDENTITY_QUERY_KEY,
    queryFn: () => getApi().identity.get(ticket ?? undefined),
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
