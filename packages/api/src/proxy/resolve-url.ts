import type { ApiConfigSetting } from "@ryx/shared-types";

import { AUTH_FLOW_METHODS } from "../methods/auth-flow.js";

const DEFAULT_PROXY_PATH = "/Home/Proxy";

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

/** Legacy uses absolute service URL; Vite dev uses same-origin path + proxy. */
function toFetchUrl(serviceUrl: string, baseUrl: string): string {
  const base = normalizeBase(baseUrl);
  if (!base) {
    try {
      return new URL(serviceUrl).pathname;
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
  const [urlKey, controller, ...actionParts] = parts;
  const serviceBase = apiConfig.Urls[urlKey];
  if (!serviceBase) return null;
  const action = actionParts.join("-");
  const absolute = `${serviceBase.replace(/\/$/, "")}/${controller}/${action}`;
  return toFetchUrl(absolute, baseUrl);
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
