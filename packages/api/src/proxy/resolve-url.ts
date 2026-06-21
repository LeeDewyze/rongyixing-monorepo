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
}

function normalizeBase(baseUrl: string): string {
  return baseUrl.replace(/\/$/, "");
}

/** Resolve POST URL from Method string (beeant getUrl logic). */
export function resolveUrl(options: ResolveUrlOptions): string {
  const base = normalizeBase(options.baseUrl);

  if (options.explicitUrl) {
    return options.explicitUrl;
  }

  if (options.apiConfig?.LoginUrl && options.method && LOGIN_URL_METHODS.has(options.method)) {
    return options.apiConfig.LoginUrl;
  }

  if (options.isForward || !options.method) {
    return `${base}${DEFAULT_PROXY_PATH}`;
  }

  if (options.mode === "direct" && options.apiConfig?.Urls) {
    const parts = options.method.split("-");
    if (parts.length >= 3) {
      const [urlKey, controller, ...actionParts] = parts;
      const serviceBase = options.apiConfig.Urls[urlKey];
      if (serviceBase) {
        const action = actionParts.join("-");
        return `${serviceBase.replace(/\/$/, "")}/${controller}/${action}`;
      }
    }
  }

  return `${base}${DEFAULT_PROXY_PATH}`;
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
