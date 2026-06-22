import type { ApiMode, ApiConfigSetting } from "@ryx/shared-types";

import {
  createAuthProxyApi,
  createIdentityApi,
  type AuthProxyApi,
  type IdentityApi,
} from "./apis/auth-proxy.js";
import { createAuthApi } from "./apis/auth.js";
import { createFlightApi, type FlightApi } from "./apis/flight.js";
import { createHotelApi, type HotelApi } from "./apis/hotel.js";
import { createMemberApi, type MemberApi } from "./apis/member.js";
import { createOrderApi, type OrderApi } from "./apis/order.js";
import { createPassengerApi, type PassengerApi } from "./apis/passenger.js";
import { createPayApi, type PayApi } from "./apis/pay.js";
import { createTmcApi, type TmcApi } from "./apis/tmc.js";
import { createTrainApi, type TrainApi } from "./apis/train.js";
import { createTravelApi, type TravelApi } from "./apis/travel.js";
import { createApiClient, type ApiClient, type ApiClientConfig } from "./client.js";
import { createGatewayClient, type GatewayClient } from "./gateway/gateway.js";
import {
  createProxyClient,
  type MockHandler,
  type ProxyClient,
  type ProxyClientConfig,
} from "./proxy/index.js";

export { ApiError } from "./errors.js";
export { createApiClient, type ApiClient, type ApiClientConfig } from "./client.js";
export { createAuthApi, type AuthApi } from "./apis/auth.js";
export {
  createAuthProxyApi,
  createIdentityApi,
  type AuthProxyApi,
  type IdentityApi,
} from "./apis/auth-proxy.js";
export { createHotelApi, type HotelApi } from "./apis/hotel.js";
export { createFlightApi, type FlightApi } from "./apis/flight.js";
export {
  adaptFlightDetailResponse,
  applyLegacyInitDetailResult,
  formatCabinTypeName,
  normalizeFlightDetailResponse,
  normalizeFlightDetailResult,
  resolveCheckedBaggage,
  selectCabinsForSegment,
} from "./apis/flight-detail-adapter.js";
export { createOrderApi, type OrderApi } from "./apis/order.js";
export { createPayApi, type PayApi } from "./apis/pay.js";
export { createPassengerApi, type PassengerApi } from "./apis/passenger.js";
export { createMemberApi, type MemberApi } from "./apis/member.js";
export { createTrainApi, type TrainApi } from "./apis/train.js";
export { createTravelApi, type TravelApi } from "./apis/travel.js";
export { createTmcApi, type TmcApi } from "./apis/tmc.js";
export * from "./methods/auth-flow.js";
export * from "./methods/flight-flow.js";
export * from "./methods/hotel-flow.js";
export * from "./methods/order-flow.js";
export * from "./methods/passenger-flow.js";
export * from "./methods/member-flow.js";
export * from "./methods/train-flow.js";
export * from "./methods/travel-flow.js";
export * from "./methods/index.js";
export * from "./proxy/index.js";
export { createGatewayClient, GATEWAY_PATHS, type GatewayClient } from "./gateway/gateway.js";
export { uploadFile } from "./gateway/upload.js";

export interface CreateApiConfig extends ApiClientConfig {
  mode?: ApiMode;
  appId?: string;
  mockDelay?: number;
  mockHandler?: MockHandler;
  getTicket?: () => string | null;
  getTicketName?: () => string;
  getDomain?: () => string | null;
  getLanguage?: () => string;
  getExtraFields?: () => Record<string, string>;
  rewriteUrl?: (url: string) => string;
  /** When set, skips fetching `/Home/Setting` if Token is present. */
  apiConfig?: ApiConfigSetting | null;
  onNoAuthorize?: () => void;
  onSystemError?: (message: string) => void;
}

export interface Api {
  client: ApiClient;
  proxy: ProxyClient;
  gateway: GatewayClient;
  auth: ReturnType<typeof createAuthApi>;
  authProxy: AuthProxyApi;
  identity: IdentityApi;
  hotel: HotelApi;
  flight: FlightApi;
  order: OrderApi;
  pay: PayApi;
  member: MemberApi;
  passenger: PassengerApi;
  travel: TravelApi;
  train: TrainApi;
  tmc: TmcApi;
}

/** Create a shared API surface for all client apps. */
export function createApi(config: CreateApiConfig): Api {
  const client = createApiClient(config);

  const proxyConfig: ProxyClientConfig = {
    baseUrl: config.baseUrl,
    mode: config.mode ?? "proxy",
    appId: config.appId,
    fetchImpl: config.fetchImpl,
    getTicket: config.getTicket,
    getTicketName: config.getTicketName,
    getDomain: config.getDomain,
    getLanguage: config.getLanguage,
    getExtraFields: config.getExtraFields,
    rewriteUrl: config.rewriteUrl,
    apiConfig: config.apiConfig,
    mockDelay: config.mockDelay,
    mockHandler: config.mockHandler,
    onUnauthorized: config.onUnauthorized,
    onNoAuthorize: config.onNoAuthorize,
    onSystemError: config.onSystemError,
  };

  const proxy = createProxyClient(proxyConfig);
  const gateway = createGatewayClient({
    baseUrl: config.baseUrl,
    fetchImpl: config.fetchImpl,
  });

  return {
    client,
    proxy,
    gateway,
    auth: createAuthApi(client),
    authProxy: createAuthProxyApi(proxy),
    identity: createIdentityApi(proxy),
    hotel: createHotelApi(proxy),
    flight: createFlightApi(proxy),
    order: createOrderApi(proxy),
    pay: createPayApi(proxy),
    member: createMemberApi(proxy),
    passenger: createPassengerApi(proxy),
    travel: createTravelApi(proxy),
    train: createTrainApi(proxy),
    tmc: createTmcApi(proxy),
  };
}
