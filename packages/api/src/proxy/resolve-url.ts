import type { ApiConfigSetting } from "@ryx/shared-types";

import { AUTH_FLOW_METHODS } from "../methods/auth-flow.js";
import { TMC_METHODS } from "../methods/tmc.js";

const DEFAULT_PROXY_PATH = "/Home/Proxy";

/** Legacy posts unsigned identity websocket to /Home/Proxy (empty Method in getUrl). */
const PROXY_ONLY_METHODS = new Set<string>([
  AUTH_FLOW_METHODS.IDENTITY_WEBSOCKET,
  TMC_METHODS.HOME_TOURIST,
]);

const LOGIN_URL_METHODS = new Set<string>([
  AUTH_FLOW_METHODS.LOGIN,
  AUTH_FLOW_METHODS.MOBILE_LOGIN,
  AUTH_FLOW_METHODS.DEVICE_LOGIN,
]);

export function isLoginMethod(method: string): boolean {
  return LOGIN_URL_METHODS.has(method);
}

export interface ResolveUrlOptions {
  baseUrl: string;
  method: string;
  explicitUrl?: string;
  apiConfig?: ApiConfigSetting | null;
  mode?: "proxy" | "direct";
  isForward?: boolean;
  domain?: string | null;
}

function normalizeBase(baseUrl: string): string {
  return baseUrl.replace(/\/$/, "");
}

/** Vite dev prefix — disambiguates shared paths like /Home/List across microservices. */
export const DEV_RYX_PROXY_PREFIX = "/__ryx";

/** Legacy uses absolute service URL; Vite dev uses same-origin path + proxy. */
function toFetchUrl(serviceUrl: string, baseUrl: string, urlKey?: string): string {
  const base = normalizeBase(baseUrl);
  if (!base) {
    try {
      const pathname = new URL(serviceUrl).pathname;
      return urlKey ? `${DEV_RYX_PROXY_PREFIX}/${urlKey}${pathname}` : pathname;
    } catch {
      return serviceUrl;
    }
  }
  return serviceUrl;
}

function resolveServiceUrl(
  method: string,
  apiConfig: ApiConfigSetting,
  baseUrl: string,
): string | null {
  const parts = method.split("-");
  if (parts.length < 3) return null;
  const urlKey = parts[0] ?? "";
  const controller = parts[1] ?? "";
  const actionParts = parts.slice(2);
  const serviceBase = apiConfig.Urls[urlKey];
  if (!serviceBase) return null;
  const action = actionParts.join("-");
  const absolute = `${serviceBase.replace(/\/$/, "")}/${controller}/${action}`;
  return toFetchUrl(absolute, baseUrl, urlKey);
}

function isProxyOnlyMethod(method: string): boolean {
  return PROXY_ONLY_METHODS.has(method) || method.startsWith("TmcTourist");
}

/** Resolve POST URL from Method string (beeant getUrl logic). */
export function resolveUrl(options: ResolveUrlOptions): string {
  const base = normalizeBase(options.baseUrl);

  if (options.explicitUrl) {
    return appendDomainQuery(options.explicitUrl, options.domain);
  }

  if (options.apiConfig?.LoginUrl && options.method && LOGIN_URL_METHODS.has(options.method)) {
    return options.apiConfig.LoginUrl;
  }

  if (options.isForward || !options.method) {
    return appendDomainQuery(`${base}${DEFAULT_PROXY_PATH}`, options.domain);
  }

  if (isProxyOnlyMethod(options.method)) {
    return appendDomainQuery(`${base}${DEFAULT_PROXY_PATH}`, options.domain);
  }

  // Legacy: when ApiConfig.Urls is loaded, POST directly to service URL (not /Home/Proxy).
  if (options.apiConfig?.Urls) {
    const serviceUrl = resolveServiceUrl(options.method, options.apiConfig, options.baseUrl);
    if (serviceUrl) {
      return serviceUrl;
    }
  }

  return appendDomainQuery(`${base}${DEFAULT_PROXY_PATH}`, options.domain);
}

function appendDomainQuery(url: string, domain?: string | null): string {
  if (!domain?.trim()) {
    return url;
  }
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}domain=${encodeURIComponent(domain.trim())}`;
}

/** True when POST goes through app gateway `/Home/Proxy` (not direct microservice URL). */
export function isGatewayProxyUrl(url: string): boolean {
  try {
    const pathname = url.startsWith("http") ? new URL(url).pathname : url.split("?")[0] ?? url;
    return pathname.includes("/Home/Proxy");
  } catch {
    return url.includes("/Home/Proxy");
  }
}

export function parseMethod(method: string): {
  urlKey: string;
  controller: string;
  action: string;
} {
  const parts = method.split("-");
  if (parts.length < 3) {
    return { urlKey: method, controller: "", action: "" };
  }
  return {
    urlKey: parts[0] ?? "",
    controller: parts[1] ?? "",
    action: parts.slice(2).join("-"),
  };
}
