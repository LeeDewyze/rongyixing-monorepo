import type {
  AirportResourceParams,
  AirportResourceResponse,
  FlightDetailParams,
  FlightDetailResult,
  FlightListResult,
  FlightSearchParams,
  Trafficline,
  TrafficlineDto,
} from "@ryx/shared-types";

import { normalizeFlightDetailResponse } from "./flight-detail-adapter.js";
import { FLIGHT_FLOW_METHODS } from "../methods/flight-flow.js";
import type { ProxyClient } from "../proxy/proxy-client.js";

export interface FlightApi {
  getDomesticAirports(params?: AirportResourceParams): Promise<TrafficlineDto[]>;
  getAirports(params?: AirportResourceParams): Promise<Trafficline[]>;
  searchFlights(params: FlightSearchParams): Promise<FlightListResult>;
  getFlightDetail(params: FlightDetailParams): Promise<FlightDetailResult>;
}

export function createFlightApi(proxy: ProxyClient): FlightApi {
  return {
    async getDomesticAirports(params = {}) {
      const result = await proxy.send<AirportResourceResponse>({
        method: FLIGHT_FLOW_METHODS.RESOURCE_AIRPORT,
        data: params,
      });
      return (result?.Trafficlines ?? []) as TrafficlineDto[];
    },
    async getAirports(params = {}) {
      const res = await proxy.send<AirportResourceResponse>({
        method: FLIGHT_FLOW_METHODS.RESOURCE_AIRPORT,
        data: params,
      });
      return (res?.Trafficlines ?? []) as Trafficline[];
    },
    searchFlights(params) {
      return proxy.send<FlightListResult>({
        method: FLIGHT_FLOW_METHODS.HOME_INDEX,
        data: params,
        version: "2.0",
        requestTimeout: 60,
        timeoutMs: 60_000,
      });
    },
    async getFlightDetail(params) {
      const raw = await proxy.send<unknown>({
        method: FLIGHT_FLOW_METHODS.HOME_DETAIL,
        data: params,
        version: "2.0",
        requestTimeout: 60,
        timeoutMs: 60_000,
      });
      return normalizeFlightDetailResponse(raw);
    },
  };
}
