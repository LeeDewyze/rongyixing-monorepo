import type { ApiConfigSetting, IResponse } from "@ryx/shared-types";

const DEFAULT_STORAGE_KEY = "ryx_api_config";

export interface ApiConfigLoaderOptions {
  baseUrl: string;
  appId?: string;
  fetchImpl?: typeof fetch;
  storageKey?: string;
  storage?: Pick<Storage, "getItem" | "setItem">;
}

/** Unwrap `/Home/Setting` envelope (`{ Data: { Token, Urls, LoginUrl } }`). */
export function normalizeApiConfigSetting(payload: unknown): ApiConfigSetting {
  const wrapped = payload as IResponse<ApiConfigSetting>;
  const data = (wrapped?.Data ?? payload) as ApiConfigSetting;
  return {
    Token: data.Token ?? "",
    Urls: data.Urls ?? {},
    LoginUrl: data.LoginUrl,
  };
}

function buildSettingUrl(baseUrl: string, appId?: string): string {
  const base = baseUrl.replace(/\/$/, "");
  const query = appId ? `?appId=${encodeURIComponent(appId)}` : "";
  return `${base}/Home/Setting${query}`;
}

export async function loadApiConfig(options: ApiConfigLoaderOptions): Promise<ApiConfigSetting> {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  const response = await fetchImpl(buildSettingUrl(options.baseUrl, options.appId));

  if (!response.ok) {
    throw new Error(`Failed to load API config: HTTP ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  const setting = normalizeApiConfigSetting(payload);
  const storage = options.storage ?? globalThis.localStorage;
  const key = options.storageKey ?? DEFAULT_STORAGE_KEY;

  try {
    storage?.setItem(key, JSON.stringify(setting));
  } catch {
    // ignore quota / SSR
  }

  return setting;
}

export function readCachedApiConfig(
  storageKey = DEFAULT_STORAGE_KEY,
  storage: Pick<Storage, "getItem"> = globalThis.localStorage,
): ApiConfigSetting | null {
  try {
    const raw = storage?.getItem(storageKey);
    if (!raw) {
      return null;
    }
    return normalizeApiConfigSetting(JSON.parse(raw));
  } catch {
    return null;
  }
}
