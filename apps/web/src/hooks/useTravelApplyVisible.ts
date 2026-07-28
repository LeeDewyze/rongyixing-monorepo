import { useQuery } from "@tanstack/react-query";
import { hasTravelApplyWorkbench } from "@ryx/api";

import type { HomeTravelMode } from "@/config/home-assets";
import { getApi } from "@/lib/api";
import { getApiMode } from "@/lib/env";
import { getTicket } from "@/lib/session";

/** Legacy home only renders the 出差申请 workbench group when the TMC configured it. */
export function useTravelApplyVisible(travelMode: HomeTravelMode): boolean {
  const query = useQuery({
    queryKey: ["tmc", "workbench"],
    queryFn: () => getApi().tmc.getWorkbenches(),
    enabled: travelMode === "business" && (Boolean(getTicket()) || getApiMode() === "mock"),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return hasTravelApplyWorkbench(query.data ?? []);
}
