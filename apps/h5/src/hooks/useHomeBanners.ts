import { useQuery } from "@tanstack/react-query";

import { getApi } from "@/lib/api";
import { filterPersonalizedBanners, resolveBannerSlides } from "@/lib/home-banners";
import { getApiMode } from "@/lib/env";
import { getTicket } from "@/lib/session";

export function useHomeBanners() {
  const hasTicket = Boolean(getTicket());
  const apiMode = getApiMode();
  const canFetch = hasTicket || apiMode === "mock";

  return useQuery({
    queryKey: ["home", "banners", hasTicket, apiMode],
    queryFn: async () => {
      const banners = await getApi().tmc.getBanners();
      const filtered = filterPersonalizedBanners(banners);
      return resolveBannerSlides(filtered);
    },
    enabled: canFetch,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
