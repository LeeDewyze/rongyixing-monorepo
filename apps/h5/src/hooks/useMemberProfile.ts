import { useQuery } from "@tanstack/react-query";

import { getApi } from "@/lib/api";

export function useMemberProfile() {
  return useQuery({
    queryKey: ["member", "profile"],
    queryFn: () => getApi().member.getProfile(),
    staleTime: 5 * 60 * 1000,
  });
}
