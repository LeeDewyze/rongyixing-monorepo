import type { ApiConfigSetting } from "@ryx/shared-types";

const DEFAULT_PROXY_PATH = "/Home/Proxy";

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
