import type { HomeSitemapItem } from "@ryx/shared-types";

import { MMS_METHODS } from "../methods/mms.js";
import type { ProxyClient } from "../proxy/proxy-client.js";

export interface MmsApi {
  getSitemaps(params: { mmsId: string }): Promise<HomeSitemapItem[]>;
}

export function createMmsApi(proxy: ProxyClient): MmsApi {
  return {
    async getSitemaps({ mmsId }) {
      const raw = await proxy.send<unknown>({
        method: MMS_METHODS.SITEMAP_LIST,
        data: {},
        requestFields: {
          MmsId: mmsId,
          IsRedirctLogin: false,
        },
      });
      return Array.isArray(raw) ? (raw as HomeSitemapItem[]) : [];
    },
  };
}
