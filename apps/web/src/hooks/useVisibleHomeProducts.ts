import { useQuery } from "@tanstack/react-query";
import {
  getVisibleHomeProductsFromSitemaps,
  getVisibleHomeProductsFromWorkbenches,
} from "@ryx/api";
import type { HomeBookProduct } from "@ryx/shared-types";

import type { HomeTravelMode } from "@/config/home-assets";
import { getApi } from "@/lib/api";
import { getApiMode, getAppId } from "@/lib/env";
import { getTicket } from "@/lib/session";
import { resolveTouristContext } from "@/lib/tourist-context";

export function useVisibleHomeProducts(travelMode: HomeTravelMode): HomeBookProduct[] {
  const hasTicket = Boolean(getTicket());
  const apiMode = getApiMode();

  const query = useQuery({
    queryKey: ["home", "visible-products", travelMode],
    queryFn: async () => {
      if (travelMode === "personal") {
        const api = getApi();
        const context = await resolveTouristContext({
          appId: getAppId(),
          sender: api.proxy,
        });
        const sitemaps = await api.mms.getSitemaps({ mmsId: context.TouristMmsId });
        return getVisibleHomeProductsFromSitemaps(sitemaps);
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
