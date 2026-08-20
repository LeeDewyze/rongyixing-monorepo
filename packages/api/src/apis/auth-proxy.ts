import type {
  DeviceLoginParams,
  DingTalkBindingItem,
  DingTalkBindParams,
  DingTalkCheckResult,
  DingTalkLoginParams,
  DingTalkRemoveParams,
  IdentityCheckResult,
  IdentityDto,
  LoginResultDto,
  MobileLoginParams,
  PasswordLoginParams,
  RybLoginParams,
  WebSocketUrlDto,
} from "@ryx/shared-types";

import { AUTH_FLOW_METHODS } from "../methods/auth-flow.js";
import { AUTH_METHODS } from "../methods/auth.js";
import type { ProxyClient } from "../proxy/proxy-client.js";
import { assertSuccess } from "../proxy/response-adapter.js";

const H5_LOGIN_TYPE = "H5";

export interface AuthProxyApi {
  deviceLogin(params: DeviceLoginParams): Promise<LoginResultDto>;
  login(params: PasswordLoginParams): Promise<LoginResultDto>;
  mobileLogin(params: MobileLoginParams): Promise<LoginResultDto>;
  rybLogin(params: RybLoginParams): Promise<LoginResultDto>;
  dingTalkLogin(params: DingTalkLoginParams): Promise<LoginResultDto>;
  logout(params?: { ticket?: string; ticketName?: string }): Promise<boolean>;
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
    async rybLogin(params) {
      // RYBLogin starts without a local session. Keep its failure response local so
      // the caller can show the SSO failure message before navigating to login.
      const response = await proxy.sendResponse<LoginResultDto>({
        method: AUTH_FLOW_METHODS.RYB_LOGIN,
        data: {
          ticket: params.ticket,
          LoginType: params.LoginType ?? "ryb",
        },
        requestFields: {
          Ticket: "",
          TicketName: "",
          authType: 1,
        },
      });
      return assertSuccess(response);
    },
    dingTalkLogin(params) {
      return proxy.send<LoginResultDto>({
        method: AUTH_FLOW_METHODS.DINGTALK_LOGIN,
        data: {
          Code: params.Code,
          ...(params.Device ? { Device: params.Device } : {}),
          ...(params.DeviceName ? { DeviceName: params.DeviceName } : {}),
        },
      });
    },
    logout(params = {}) {
      const ticket = params.ticket ?? "";
      const ticketName = params.ticketName || "ticket";
      return proxy.send<boolean>({
        method: AUTH_FLOW_METHODS.LOGOUT,
        // Legacy LoginService.logout sends the ticket again inside Data and
        // posts the request unsigned to the gateway proxy.
        url: "/Home/Proxy",
        data: JSON.stringify({ Ticket: ticket, [ticketName]: ticket }),
        skipSign: true,
        timeoutMs: 30_000,
      });
    },
  };
}

export interface DingTalkApi {
  check(): Promise<DingTalkCheckResult>;
  bind(params: DingTalkBindParams): Promise<DingTalkActionResult>;
  list(): Promise<DingTalkBindingItem[]>;
  remove(params: DingTalkRemoveParams): Promise<boolean>;
}

export interface DingTalkActionResult {
  data: boolean;
  message?: string;
}

export function createDingTalkApi(proxy: ProxyClient): DingTalkApi {
  return {
    async check() {
      const response = await proxy.sendResponse<unknown>({
        method: AUTH_METHODS.DINGTALK_CHECK,
        data: { SdkType: "DingTalk" },
      });
      return {
        shouldBind: response.Status === true,
        message: response.Message?.trim() || undefined,
      };
    },
    async bind(params) {
      const response = await proxy.sendResponse<boolean>(
        {
          method: AUTH_METHODS.DINGTALK_BIND,
          data: params,
          isShowLoading: true,
        },
        { handleErrors: true },
      );
      return {
        data: assertSuccess(response),
        message: response.Message?.trim() || undefined,
      };
    },
    async list() {
      const data = await proxy.send<unknown>({
        method: AUTH_METHODS.DINGTALK_LIST,
        data: {},
      });
      if (Array.isArray(data)) return data as DingTalkBindingItem[];
      if (data && typeof data === "object" && "Data" in data && Array.isArray(data.Data)) {
        return data.Data as DingTalkBindingItem[];
      }
      return [];
    },
    remove(params) {
      return proxy.send<boolean>({
        method: AUTH_METHODS.DINGTALK_REMOVE,
        data: params,
        isShowLoading: true,
      });
    },
  };
}

export interface IdentityApi {
  get(ticket?: string): Promise<IdentityDto>;
  check(loginType?: string): Promise<IdentityCheckResult>;
  getWebSocketUrl(): Promise<WebSocketUrlDto | null>;
}

export function createIdentityApi(proxy: ProxyClient): IdentityApi {
  return {
    get(ticket) {
      return proxy.send<IdentityDto>({
        method: AUTH_FLOW_METHODS.IDENTITY_GET,
        data: JSON.stringify({ Ticket: ticket ?? "" }),
        requestFields: ticket ? { Ticket: ticket } : undefined,
        skipSign: true,
      });
    },
    async check(loginType = H5_LOGIN_TYPE) {
      const response = await proxy.sendResponse<unknown>({
        method: AUTH_FLOW_METHODS.IDENTITY_CHECK,
        data: JSON.stringify({ LoginType: loginType }),
        skipSign: true,
        isShowLoading: true,
      });
      const message = response.Message?.trim();
      return {
        forceLogout: response.Status === true,
        message: message || undefined,
      };
    },
    async getWebSocketUrl() {
      // WebSocket bootstrap is optional. Match Identity/Check by consuming the
      // raw response so a backend session message cannot trigger global logout.
      const response = await proxy.sendResponse<WebSocketUrlDto>({
        method: AUTH_FLOW_METHODS.IDENTITY_WEBSOCKET,
        data: {},
        skipSign: true,
        isShowLoading: true,
      });
      return response.Status ? response.Data : null;
    },
  };
}
