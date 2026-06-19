import type {
  DeviceLoginParams,
  IdentityDto,
  LoginResultDto,
  MobileLoginParams,
  PasswordLoginParams,
} from "@ryx/shared-types";

import { AUTH_FLOW_METHODS } from "../methods/auth-flow.js";
import type { ProxyClient } from "../proxy/proxy-client.js";

export interface AuthProxyApi {
  deviceLogin(params: DeviceLoginParams): Promise<LoginResultDto>;
  login(params: PasswordLoginParams): Promise<LoginResultDto>;
  mobileLogin(params: MobileLoginParams): Promise<LoginResultDto>;
  logout(): Promise<boolean>;
}

export function createAuthProxyApi(proxy: ProxyClient): AuthProxyApi {
  return {
    deviceLogin(params) {
      return proxy.send<LoginResultDto>({
        method: AUTH_FLOW_METHODS.DEVICE_LOGIN,
        data: params,
      });
    },
    login(params) {
      return proxy.send<LoginResultDto>({
        method: AUTH_FLOW_METHODS.LOGIN,
        data: params,
      });
    },
    mobileLogin(params) {
      return proxy.send<LoginResultDto>({
        method: AUTH_FLOW_METHODS.MOBILE_LOGIN,
        data: params,
      });
    },
    logout() {
      return proxy.send<boolean>({
        method: AUTH_FLOW_METHODS.LOGOUT,
        data: {},
      });
    },
  };
}

export interface IdentityApi {
  get(ticket?: string): Promise<IdentityDto>;
  check(ticket?: string): Promise<boolean>;
  getWebSocketUrl(): Promise<string>;
}

export function createIdentityApi(proxy: ProxyClient): IdentityApi {
  return {
    get(ticket) {
      return proxy.send<IdentityDto>({
        method: AUTH_FLOW_METHODS.IDENTITY_GET,
        data: ticket ? { Ticket: ticket } : {},
      });
    },
    check(ticket) {
      return proxy.send<boolean>({
        method: AUTH_FLOW_METHODS.IDENTITY_CHECK,
        data: ticket ? { Ticket: ticket } : {},
      });
    },
    getWebSocketUrl() {
      return proxy.send<string>({
        method: AUTH_FLOW_METHODS.IDENTITY_WEBSOCKET,
        data: {},
      });
    },
  };
}
