import { useQuery } from "@tanstack/react-query";

import { getApi } from "@/lib/api";

export function useWorkbenches() {
  return useQuery({
    queryKey: ["tmc", "workbench"],
    queryFn: () => getApi().tmc.getWorkbenches(),
    staleTime: 5 * 60_000,
  });
}
