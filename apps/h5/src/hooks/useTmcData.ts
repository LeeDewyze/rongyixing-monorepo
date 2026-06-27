import { useQuery } from "@tanstack/react-query";

import { getApi } from "@/lib/api";

export function useTmcData() {
  return useQuery({
    queryKey: ["tmc", "data"],
    queryFn: () => getApi().tmc.getTmcData(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
