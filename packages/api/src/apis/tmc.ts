import type { TmcInfo } from "@ryx/shared-types";

import { TMC_METHODS } from "../methods/tmc.js";
import type { ProxyClient } from "../proxy/proxy-client.js";

export interface TmcApi {
  getTmc(): Promise<TmcInfo>;
}

export function createTmcApi(proxy: ProxyClient): TmcApi {
  return {
    getTmc() {
      return proxy.send<TmcInfo>({
        method: TMC_METHODS.TMC_GETTMC,
        data: {},
      });
    },
  };
}
