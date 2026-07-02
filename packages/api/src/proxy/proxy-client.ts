import type { ApiConfigSetting, ApiMode, IResponse, ProxySendOptions } from "@ryx/shared-types";

import { ApiError } from "../errors.js";
import { loadApiConfig, readCachedApiConfig } from "./api-config.js";
import {
  createRequestEntity,
  buildUnsignedFormBody,
  encodeFormBody,
  toFormFields,
} from "./request-entity.js";
import { isGatewayProxyUrl, isLoginMethod, resolveUrl } from "./resolve-url.js";
import { assertSuccess } from "./response-adapter.js";
import { computeSign, serializeData } from "./sign.js";

export interface MockHandler {
  (method: string, data: unknown): Promise<IResponse<unknown>> | IResponse<unknown>;
}

export interface ProxyClientConfig {
  baseUrl: string;
  mode?: ApiMode;
  appId?: string;
  fetchImpl?: typeof fetch;
  getTicket?: () => string | null;
  getTicketName?: () => string;
  getDomain?: () => string | null;
  getLanguage?: () => string;
  getExtraFields?: () => Record<string, string>;
  mockDelay?: number;
  mockHandler?: MockHandler;
  apiConfig?: ApiConfigSetting | null;
  rewriteUrl?: (url: string) => string;
  onUnauthorized?: () => void;
  onNoAuthorize?: () => void;
  onSystemError?: (message: string) => void;
}

export interface ProxyClient {
  send<TRes = unknown>(options: ProxySendOptions): Promise<TRes>;
  loadApiConfig(): Promise<ApiConfigSetting>;
  getApiConfig(): ApiConfigSetting | null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getMethodUrlKey(method: string): string {
  return method.split("-")[0] ?? "";
}

function hasServiceUrl(apiConfig: ApiConfigSetting | null, method: string): boolean {
  const urlKey = getMethodUrlKey(method);
  if (!urlKey) {
    return true;
  }
  return Boolean(apiConfig?.Urls?.[urlKey]);
}

export function createProxyClient(config: ProxyClientConfig): ProxyClient {
  const fetchImpl = config.fetchImpl ?? globalThis.fetch.bind(globalThis);
  const mode = config.mode ?? "proxy";
  let apiConfig = config.apiConfig ?? readCachedApiConfig() ?? null;

  function getToken(): string {
    return apiConfig?.Token ?? "";
  }

  async function ensureApiConfig(method: string): Promise<ApiConfigSetting | null> {
    if (
      apiConfig?.Token &&
      apiConfig?.Urls &&
      Object.keys(apiConfig.Urls).length > 0 &&
      hasServiceUrl(apiConfig, method)
    ) {
      return apiConfig;
    }
    if (mode === "mock") {
      return apiConfig;
    }
    try {
      apiConfig = await loadApiConfig({
        baseUrl: config.baseUrl,
        appId: config.appId,
        fetchImpl,
      });
    } catch {
      // direct/proxy may still work via /Home/Proxy
    }
    return apiConfig;
  }

  function handleErrorCode(code: string | null | undefined, message: string): void {
    if (!code) return;
    const normalized = code.toLowerCase();
    if (normalized === "nologin") {
      config.onUnauthorized?.();
      return;
    }
    if (normalized === "noauthorize") {
      config.onNoAuthorize?.();
      return;
    }
    if (normalized === "systemerror") {
      config.onSystemError?.(message);
    }
  }

  async function sendMock<TRes>(method: string, data: unknown): Promise<IResponse<TRes>> {
    const delay = config.mockDelay ?? 0;
    if (delay > 0) {
      await sleep(delay);
    }

    if (!config.mockHandler) {
      const response: IResponse<TRes> = {
        Status: false,
        Code: "MOCK_NOT_FOUND",
        Message: `No mock handler registered for ${method}`,
        Data: null as TRes,
      };
      console.warn(`[mock] ${response.Message}`);
      return response;
    }

    const result = await config.mockHandler(method, data);
    return result as IResponse<TRes>;
  }

  async function sendReal<TRes>(options: ProxySendOptions): Promise<IResponse<TRes>> {
    const cfg = await ensureApiConfig(options.method);
    const token = getToken();
    const resolvedUrl = resolveUrl({
      baseUrl: config.baseUrl,
      method: options.method,
      explicitUrl: options.url,
      apiConfig: cfg,
      mode: mode === "direct" ? "direct" : "proxy",
      isForward: options.isForward,
      domain: config.getDomain?.() ?? undefined,
    });
    const url = config.rewriteUrl ? config.rewriteUrl(resolvedUrl) : resolvedUrl;
    const attachExtraFields =
      !options.skipSign && isGatewayProxyUrl(resolvedUrl) && Boolean(config.getExtraFields);

    const req = createRequestEntity(options.method, options.data, {
      getTicket: isLoginMethod(options.method) ? () => "" : config.getTicket,
      getTicketName: config.getTicketName,
      getDomain: config.getDomain,
      getLanguage: config.getLanguage,
      getExtraFields: attachExtraFields ? config.getExtraFields : () => ({}),
      token,
    });

    if (options.version) {
      req.Version = options.version;
    }
    if (options.isForward) {
      req.IsForward = true;
    }
    if (options.isShowLoading) {
      req.IsShowLoading = true;
    }
    if (options.requestTimeout != null) {
      req.Timeout = options.requestTimeout;
    }
    if (options.requestFields) {
      Object.assign(req, options.requestFields);
    }

    const dataStr = serializeData(req.Data);
    const includeSign = !options.skipSign;
    const sign = includeSign ? computeSign(dataStr, req.Timestamp ?? 0, token) : "";

    const body = includeSign
      ? encodeFormBody(toFormFields(req, sign, { includeSign, includeToken: true }))
      : buildUnsignedFormBody(req);
    const controller = options.timeoutMs ? new AbortController() : undefined;
    const timeoutId =
      options.timeoutMs && controller
        ? setTimeout(() => controller.abort(), options.timeoutMs)
        : undefined;

    try {
      const response = await fetchImpl(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal: controller?.signal,
      });

      if (!response.ok) {
        throw new ApiError(`Proxy request failed: HTTP ${response.status}`, response.status);
      }

      const payload = (await response.json()) as IResponse<TRes>;
      if (!payload.Status) {
        handleErrorCode(payload.Code, payload.Message);
      }
      return payload;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  return {
    async send<TRes = unknown>(options: ProxySendOptions): Promise<TRes> {
      const data = typeof options.data === "string" ? JSON.parse(options.data) : options.data;

      const response =
        mode === "mock"
          ? await sendMock<TRes>(options.method, data)
          : await sendReal<TRes>(options);

      return assertSuccess(response);
    },

    async loadApiConfig(): Promise<ApiConfigSetting> {
      apiConfig = await loadApiConfig({
        baseUrl: config.baseUrl,
        appId: config.appId,
        fetchImpl,
      });
      return apiConfig;
    },

    getApiConfig(): ApiConfigSetting | null {
      return apiConfig;
    },
  };
}
