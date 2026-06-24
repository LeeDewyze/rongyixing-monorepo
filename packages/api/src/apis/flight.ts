import type {
  AirportResourceParams,
  AirportResourceResponse,
  FlightBookParams,
  FlightBookResponse,
  FlightDetailParams,
  FlightDetailResult,
  FlightInitBookParams,
  FlightInitBookResponse,
  FlightListResult,
  FlightPolicyParams,
  FlightPolicyPassengerResult,
  FlightSearchParams,
  Trafficline,
  TrafficlineDto,
} from "@ryx/shared-types";

import { stripFlightOrderBookDto } from "./flight-book-adapter.js";
import { normalizeFlightDetailResponse } from "./flight-detail-adapter.js";
import { BOOK_METHODS } from "../methods/book.js";
import { FLIGHT_FLOW_METHODS } from "../methods/flight-flow.js";
import type { ProxyClient } from "../proxy/proxy-client.js";

export interface FlightApi {
  getDomesticAirports(params?: AirportResourceParams): Promise<TrafficlineDto[]>;
  getAirports(params?: AirportResourceParams): Promise<Trafficline[]>;
  searchFlights(params: FlightSearchParams): Promise<FlightListResult>;
  getFlightDetail(params: FlightDetailParams): Promise<FlightDetailResult>;
  getFlightPolicy(params: FlightPolicyParams): Promise<FlightPolicyPassengerResult[]>;
  initializeBook(params: FlightInitBookParams): Promise<FlightInitBookResponse>;
  submitBook(params: FlightBookParams): Promise<FlightBookResponse>;
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
    getFlightPolicy(params) {
      return proxy.send<FlightPolicyPassengerResult[]>({
        method: FLIGHT_FLOW_METHODS.HOME_POLICY,
        data: params,
        version: "2.0",
        timeoutMs: 60_000,
      });
    },
    initializeBook(params) {
      return proxy.send<FlightInitBookResponse>({
        method: BOOK_METHODS.FLIGHT_INITIALIZE,
        data: stripFlightOrderBookDto(params),
        timeoutMs: 60_000,
      });
    },
    submitBook(params) {
      return proxy.send<FlightBookResponse>({
        method: BOOK_METHODS.FLIGHT_BOOK,
        data: stripFlightOrderBookDto(params),
        timeoutMs: 60_000,
      });
    },
  };
}
