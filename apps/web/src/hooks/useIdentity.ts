import { useQuery } from "@tanstack/react-query";

import { getApi } from "@/lib/api";
import {
  IDENTITY_QUERY_KEY,
  readStoredBusinessIdentityPermission,
} from "@/lib/booking-permission-preload";
import { getApiMode } from "@/lib/env";
import { getTicket } from "@/lib/session";

/** Read the app-level identity snapshot; production pages never fetch Identity/Get themselves. */
export function useIdentity() {
  const ticket = getTicket();
  const isMock = getApiMode() === "mock";
  return useQuery({
    queryKey: IDENTITY_QUERY_KEY,
    queryFn: () => getApi().identity.get(ticket ?? undefined),
    enabled: isMock,
    initialData: () =>
      isMock ? undefined : (readStoredBusinessIdentityPermission(ticket) ?? undefined),
    staleTime: Infinity,
    retry: false,
  });
}
