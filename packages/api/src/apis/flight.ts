import type {
  AirportResourceParams,
  AirportResourceResponse,
  TrafficlineDto,
} from "@ryx/shared-types";

import { TMC_METHODS } from "../methods/tmc.js";
import type { ProxyClient } from "../proxy/proxy-client.js";

export interface FlightApi {
  getDomesticAirports(params?: AirportResourceParams): Promise<TrafficlineDto[]>;
}

export function createFlightApi(proxy: ProxyClient): FlightApi {
  return {
    async getDomesticAirports(params = {}) {
      const result = await proxy.send<AirportResourceResponse>({
        method: TMC_METHODS.RESOURCE_AIRPORT,
        data: params,
      });
      return result.Trafficlines ?? [];
    },
  };
}
