import { useQuery } from "@tanstack/react-query";
import { getVisibleHomeProductsFromWorkbenches } from "@ryx/api";
import type { HomeBookProduct } from "@ryx/shared-types";

import type { HomeTravelMode } from "@/config/home-assets";
import { loadPersonalVisibleHomeProducts } from "@/hooks/loadPersonalVisibleHomeProducts";
import { getApi } from "@/lib/api";
import { getApiMode } from "@/lib/env";
import { getTicket } from "@/lib/session";

export interface VisibleHomeProductsResult {
  products: HomeBookProduct[];
  isLoading: boolean;
}

const PRODUCTS_STALE_MS = 5 * 60 * 1000;

function resolveProductsStaleTime(data: HomeBookProduct[] | undefined): number {
  return (data?.length ?? 0) > 0 ? PRODUCTS_STALE_MS : 0;
}

export function useVisibleHomeProducts(travelMode: HomeTravelMode): VisibleHomeProductsResult {
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
    staleTime: (query) => resolveProductsStaleTime(query.state.data),
    retry: false,
  });

  const products = query.data ?? [];

  return {
    products,
    isLoading: query.isPending || (query.isFetching && products.length === 0),
  };
}
