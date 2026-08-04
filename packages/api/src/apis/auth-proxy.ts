import type {
  DeviceLoginParams,
  IdentityCheckResult,
  IdentityDto,
  LoginResultDto,
  MobileLoginParams,
  PasswordLoginParams,
  RybLoginParams,
  WebSocketUrlDto,
} from "@ryx/shared-types";

import { AUTH_FLOW_METHODS } from "../methods/auth-flow.js";
import type { ProxyClient } from "../proxy/proxy-client.js";

const H5_LOGIN_TYPE = "H5";

export interface AuthProxyApi {
  deviceLogin(params: DeviceLoginParams): Promise<LoginResultDto>;
  login(params: PasswordLoginParams): Promise<LoginResultDto>;
  mobileLogin(params: MobileLoginParams): Promise<LoginResultDto>;
  rybLogin(params: RybLoginParams): Promise<LoginResultDto>;
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
      // Beeant Data field order: Name, Password, Device, DeviceName, LoginType.
      // Order matters: Sign = md5(JSON.stringify(Data) + Timestamp + Token).
      const data: PasswordLoginParams = {
        Name: params.Name,
        Password: params.Password,
      };
      if (params.Device) {
        data.Device = params.Device;
      }
      if (params.DeviceName) {
        data.DeviceName = params.DeviceName;
      }
      data.LoginType = params.LoginType ?? H5_LOGIN_TYPE;
      return proxy.send<LoginResultDto>({
        method: AUTH_FLOW_METHODS.LOGIN,
        data,
      });
    },
    mobileLogin(params) {
      return proxy.send<LoginResultDto>({
        method: AUTH_FLOW_METHODS.MOBILE_LOGIN,
        data: params,
      });
    },
    rybLogin(params) {
      return proxy.send<LoginResultDto>({
        method: AUTH_FLOW_METHODS.RYB_LOGIN,
        data: {
          ticket: params.ticket,
          LoginType: params.LoginType ?? "ryb",
        },
        requestFields: {
          Ticket: params.ticket,
          TicketName: "",
          authType: 1,
        },
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
  check(loginType?: string): Promise<IdentityCheckResult>;
  getWebSocketUrl(): Promise<WebSocketUrlDto>;
}

export function createIdentityApi(proxy: ProxyClient): IdentityApi {
  return {
    get(ticket) {
      return proxy.send<IdentityDto>({
        method: AUTH_FLOW_METHODS.IDENTITY_GET,
        data: ticket ? { Ticket: ticket } : {},
      });
    },
    async check(loginType = H5_LOGIN_TYPE) {
      const response = await proxy.sendResponse<unknown>({
        method: AUTH_FLOW_METHODS.IDENTITY_CHECK,
        data: { LoginType: loginType },
      });
      const message = response.Message?.trim();
      return {
        forceLogout: response.Status === true,
        message: message || undefined,
      };
    },
    getWebSocketUrl() {
      return proxy.send<WebSocketUrlDto>({
        method: AUTH_FLOW_METHODS.IDENTITY_WEBSOCKET,
        data: {},
        skipSign: true,
        isShowLoading: true,
      });
    },
  };
}
