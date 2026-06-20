import type {
  AirportResourceParams,
  AirportResourceResponse,
  FlightListResult,
  FlightSearchParams,
  Trafficline,
} from "@ryx/shared-types";

import { FLIGHT_FLOW_METHODS } from "../methods/flight-flow.js";
import type { ProxyClient } from "../proxy/proxy-client.js";

export interface FlightApi {
  getAirports(params?: AirportResourceParams): Promise<Trafficline[]>;
  searchFlights(params: FlightSearchParams): Promise<FlightListResult>;
}

export function createFlightApi(proxy: ProxyClient): FlightApi {
  return {
    async getAirports(params = {}) {
      const res = await proxy.send<AirportResourceResponse>({
        method: FLIGHT_FLOW_METHODS.RESOURCE_AIRPORT,
        data: params,
      });
      return res?.Trafficlines ?? [];
    },
    searchFlights(params) {
      return proxy.send<FlightListResult>({
        method: FLIGHT_FLOW_METHODS.HOME_INDEX,
        data: params,
        version: "2.0",
        timeoutMs: 60_000,
      });
    },
  };
}
