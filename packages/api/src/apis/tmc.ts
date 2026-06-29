import type {
  HomeBanner,
  TmcData,
  TmcInfo,
  WorkbenchGroup,
  WorkbenchLoadResponse,
} from "@ryx/shared-types";
import { normalizeWorkbenchResponse } from "@ryx/shared-types";

import { normalizeBannerList } from "./home-banner-adapter.js";
import { TMC_METHODS } from "../methods/tmc.js";
import type { ProxyClient } from "../proxy/proxy-client.js";

export interface TmcApi {
  getTmc(): Promise<TmcInfo>;
  getTmcData(): Promise<TmcData>;
  getWorkbenches(): Promise<WorkbenchGroup[]>;
  getBanners(): Promise<HomeBanner[]>;
}

export function createTmcApi(proxy: ProxyClient): TmcApi {
  return {
    getTmc() {
      return proxy.send<TmcInfo>({
        method: TMC_METHODS.TMC_GETTMC,
        data: {},
      });
    },
    getTmcData() {
      return proxy.send<TmcData>({
        method: TMC_METHODS.TMC_GETTMCDATA,
        data: {},
      });
    },
    async getWorkbenches() {
      const raw = await proxy.send<WorkbenchLoadResponse>({
        method: TMC_METHODS.WORKBENCH_LOAD,
        data: {},
      });
      return normalizeWorkbenchResponse(raw);
    },
    async getBanners() {
      const raw = await proxy.send<HomeBanner[]>({
        method: TMC_METHODS.BANNER_LIST,
        data: {},
      });
      return normalizeBannerList(raw);
    },
  };
}
