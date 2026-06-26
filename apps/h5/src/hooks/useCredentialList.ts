import { useQuery } from "@tanstack/react-query";
import type { PassengerCredential, MemberPassenger } from "@ryx/shared-types";

import { getApi } from "@/lib/api";
import { getLoginUserId } from "@/lib/session";

export function useStaffCredentials() {
  const accountId = getLoginUserId();
  return useQuery({
    queryKey: ["credential", "staff", accountId],
    queryFn: async (): Promise<PassengerCredential[]> => {
      if (!accountId) return [];
      return getApi().passenger.getStaffCredentials({ AccountId: accountId });
    },
    enabled: Boolean(accountId),
    staleTime: 2 * 60 * 1000,
  });
}

export function useExternalPassengerListForManagement() {
  return useQuery({
    queryKey: ["credential", "external"],
    queryFn: async (): Promise<MemberPassenger[]> => {
      const res = await getApi().passenger.getPassengerList({
        Name: "",
        Mobile: "",
        PageIndex: 0,
        PageSize: 200,
      });
      return res.Passengers ?? [];
    },
    staleTime: 2 * 60 * 1000,
  });
}
