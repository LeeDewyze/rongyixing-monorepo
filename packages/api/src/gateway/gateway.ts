import type { ApiConfigSetting, IResponse } from "@ryx/shared-types";

import { assertSuccess } from "../proxy/response-adapter.js";
import { loadApiConfig, readCachedApiConfig } from "../proxy/api-config.js";
import {
  createRequestEntity,
  encodeFormBody,
  toFormFields,
} from "../proxy/request-entity.js";
import { computeSign, serializeData } from "../proxy/sign.js";

/** Non-Proxy gateway paths (direct POST/GET to app base URL). */
export const GATEWAY_PATHS = {
  SETTING: "/Home/Setting",
  SEND_LOGIN_MOBILE_CODE: "/Home/SendLoginMobileCode",
  SEND_IDENTITY_MOBILE_CODE: "/Home/SendIdentityMobileCode",
  SEND_REGISTER_MOBILE_CODE: "/Home/SendRegisterMobileCode",
} as const;

export interface GatewayClientConfig {
  baseUrl: string;
  appId?: string;
  fetchImpl?: typeof fetch;
  getTicket?: () => string | null;
  getTicketName?: () => string;
  getDomain?: () => string | null;
  getLanguage?: () => string;
  getExtraFields?: () => Record<string, string>;
  apiConfig?: ApiConfigSetting | null;
}

export interface SendMobileCodeParams {
  Mobile: string;
  ImageCode?: string;
  ImageValue?: string;
}

export interface GatewayClient {
  getSetting(appId?: string): Promise<unknown>;
  sendLoginMobileCode(params: SendMobileCodeParams): Promise<boolean>;
  sendIdentityMobileCode(params: SendMobileCodeParams): Promise<boolean>;
}

function normalizeBase(baseUrl: string): string {
  return baseUrl.replace(/\/$/, "");
}

export function createGatewayClient(config: GatewayClientConfig): GatewayClient {
  const fetchImpl = config.fetchImpl ?? globalThis.fetch.bind(globalThis);
  const base = normalizeBase(config.baseUrl);
  let apiConfig = config.apiConfig ?? readCachedApiConfig() ?? null;

  async function ensureApiConfig(): Promise<ApiConfigSetting | null> {
    if (apiConfig?.Token) {
      return apiConfig;
    }
    try {
      apiConfig = await loadApiConfig({
        baseUrl: config.baseUrl,
        appId: config.appId,
        fetchImpl,
      });
    } catch {
      // Keep legacy behavior tolerant; request may still be rejected by the gateway.
    }
    return apiConfig;
  }

  async function postRequestEntity<T>(path: string, data: unknown): Promise<IResponse<T>> {
    const cfg = await ensureApiConfig();
    const req = createRequestEntity("", data, {
      getTicket: config.getTicket,
      getTicketName: config.getTicketName,
      getDomain: config.getDomain,
      getLanguage: config.getLanguage,
      getExtraFields: config.getExtraFields,
      token: cfg?.Token ?? "",
    });
    const dataStr = serializeData(req.Data);
    const sign = computeSign(dataStr, req.Timestamp ?? 0, req.Token ?? "");
    const formFields = toFormFields(req, sign);
    if (!formFields.Method) {
      delete formFields.Method;
    }

    const response = await fetchImpl(`${base}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: encodeFormBody(formFields),
    });
    if (!response.ok) {
      throw new Error(`Gateway request failed: HTTP ${response.status}`);
    }
    return (await response.json()) as IResponse<T>;
  }

  return {
    async getSetting(appId) {
      const query = appId ? `?appId=${encodeURIComponent(appId)}` : "";
      const response = await fetchImpl(`${base}${GATEWAY_PATHS.SETTING}${query}`);
      if (!response.ok) {
        throw new Error(`Failed to load setting: HTTP ${response.status}`);
      }
      return response.json();
    },

    async sendLoginMobileCode(params) {
      const response = await postRequestEntity(GATEWAY_PATHS.SEND_LOGIN_MOBILE_CODE, params);
      assertSuccess(response);
      return true;
    },

    async sendIdentityMobileCode(params) {
      const response = await postRequestEntity(GATEWAY_PATHS.SEND_IDENTITY_MOBILE_CODE, params);
      assertSuccess(response);
      return true;
    },
  };
}
