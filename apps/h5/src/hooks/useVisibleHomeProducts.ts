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

  const businessQuery = useQuery({
    queryKey: ["tmc", "workbench"],
    queryFn: () => getApi().tmc.getWorkbenches(),
    enabled: travelMode === "business" && (hasTicket || apiMode === "mock"),
    staleTime: PRODUCTS_STALE_MS,
    retry: false,
  });
  const personalQuery = useQuery({
    queryKey: ["home", "visible-products", "personal"],
    queryFn: loadPersonalVisibleHomeProducts,
    enabled: travelMode === "personal",
    staleTime: (query) => resolveProductsStaleTime(query.state.data),
    retry: false,
  });

  const products =
    travelMode === "business"
      ? getVisibleHomeProductsFromWorkbenches(businessQuery.data ?? [])
      : (personalQuery.data ?? []);
  const activeQuery = travelMode === "business" ? businessQuery : personalQuery;

  return {
    products,
    isLoading: activeQuery.isPending || (activeQuery.isFetching && products.length === 0),
  };
}
