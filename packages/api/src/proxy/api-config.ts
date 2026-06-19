import type { ApiConfigSetting } from "@ryx/shared-types";

const DEFAULT_STORAGE_KEY = "ryx_api_config";

export interface ApiConfigLoaderOptions {
  baseUrl: string;
  appId?: string;
  fetchImpl?: typeof fetch;
  storageKey?: string;
  storage?: Pick<Storage, "getItem" | "setItem">;
}

function buildSettingUrl(baseUrl: string, appId?: string): string {
  const base = baseUrl.replace(/\/$/, "");
  const query = appId ? `?appId=${encodeURIComponent(appId)}` : "";
  return `${base}/Home/Setting${query}`;
}

export async function loadApiConfig(
  options: ApiConfigLoaderOptions,
): Promise<ApiConfigSetting> {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  const response = await fetchImpl(buildSettingUrl(options.baseUrl, options.appId));

  if (!response.ok) {
    throw new Error(`Failed to load API config: HTTP ${response.status}`);
  }

  const payload = (await response.json()) as ApiConfigSetting;
  const storage = options.storage ?? globalThis.localStorage;
  const key = options.storageKey ?? DEFAULT_STORAGE_KEY;

  try {
    storage?.setItem(key, JSON.stringify(payload));
  } catch {
    // ignore quota / SSR
  }

  return payload;
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
    return JSON.parse(raw) as ApiConfigSetting;
  } catch {
    return null;
  }
}
