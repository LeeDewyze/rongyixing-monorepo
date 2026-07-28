import { useQuery } from "@tanstack/react-query";
import { getVisibleHomeProductsFromWorkbenches } from "@ryx/api";
import type { HomeBookProduct } from "@ryx/shared-types";

import type { HomeTravelMode } from "@/config/home-assets";
import { loadPersonalVisibleHomeProducts } from "@/hooks/loadPersonalVisibleHomeProducts";
import { getApi } from "@/lib/api";
import { getApiMode } from "@/lib/env";
import { getTicket } from "@/lib/session";

export function useVisibleHomeProducts(travelMode: HomeTravelMode): HomeBookProduct[] {
  const hasTicket = Boolean(getTicket());
  const apiMode = getApiMode();

  const query = useQuery({
    queryKey: ["home", "visible-products", travelMode],
    queryFn: async () => {
      if (travelMode === "personal") {
        return loadPersonalVisibleHomeProducts();
      }

      const workbenches = await getApi().tmc.getWorkbenches();
      return getVisibleHomeProductsFromWorkbenches(workbenches);
    },
    enabled: travelMode === "personal" || hasTicket || apiMode === "mock",
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return query.data ?? [];
}
