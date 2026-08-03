import {
  getVisibleHomeProductsFromPersonalWorkbench,
  getVisibleHomeProductsFromSitemaps,
} from "@ryx/api";
import type { HomeBookProduct } from "@ryx/shared-types";

import { getApi } from "@/lib/api";
import { getAppId } from "@/lib/env";
import { getTicket } from "@/lib/session";
import { resolveTouristContext } from "@/lib/tourist-context";

/** Primary: MMS sitemap (legacy public). Fallback: workbench 因私出行 when MMS is down. */
export async function loadPersonalVisibleHomeProducts(): Promise<HomeBookProduct[]> {
  const api = getApi();

  try {
    const context = await resolveTouristContext({
      appId: getAppId(),
      sender: api.proxy,
    });
    const sitemaps = await api.mms.getSitemaps({ mmsId: context.TouristMmsId });
    const fromSitemap = getVisibleHomeProductsFromSitemaps(sitemaps);
    if (fromSitemap.length > 0) {
      return fromSitemap;
    }
  } catch (error) {
    console.warn("[home] personal sitemap unavailable", error);
  }

  if (!getTicket()) {
    return [];
  }

  const workbenches = await api.tmc.getWorkbenches();
  return getVisibleHomeProductsFromPersonalWorkbench(workbenches);
}
