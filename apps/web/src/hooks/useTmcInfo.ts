import { useQuery } from "@tanstack/react-query";

import { getApi } from "@/lib/api";

/** Legacy profile header org code comes from `TmcApiHomeUrl-Tmc-GetTmc` → `Code`. */
export function useTmcInfo() {
  return useQuery({
    queryKey: ["tmc", "info"],
    queryFn: () => getApi().tmc.getTmc(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
