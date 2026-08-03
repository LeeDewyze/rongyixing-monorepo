const DEFAULT_APP_ID = "com.ronglvonline.app";
const DEFAULT_APP_BASE_URL = "https://app.rongtrip.cn";

export function getAppName(): string {
  return import.meta.env.VITE_APP_NAME ?? "RongYiXing Web";
}

export function getAppId(): string {
  return import.meta.env.VITE_APP_ID?.trim() || DEFAULT_APP_ID;
}

export function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL ?? "";
  if (getApiMode() === "proxy") {
    return "";
  }
  return configured;
}

export function getLegacyAppBaseUrl(): string {
  return (import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_APP_BASE_URL).replace(/\/$/, "");
}

function parseAppBaseUrl(): URL {
  try {
    return new URL(getLegacyAppBaseUrl());
  } catch {
    return new URL(DEFAULT_APP_BASE_URL);
  }
}

/** Host suffix of the configured app base: `app.rtesp.com` → `rtesp.com`. */
export function getAppBaseDomain(): string {
  const { hostname } = parseAppBaseUrl();
  return hostname.startsWith("app.") ? hostname.slice("app.".length) : hostname;
}

/** Protocol of the configured app base — the test environment is http, production is https. */
export function getAppBaseProtocol(): string {
  return parseAppBaseUrl().protocol;
}

const API_MODE_KEY = "ryx_api_mode";

export function getApiMode(): "mock" | "proxy" | "direct" {
  const forcedMode = import.meta.env.VITE_FORCE_API_MODE;
  if (forcedMode === "mock" || forcedMode === "proxy" || forcedMode === "direct") {
    return forcedMode;
  }

  const session = sessionStorage.getItem(API_MODE_KEY);
  if (session === "mock" || session === "proxy" || session === "direct") {
    return session;
  }

  const envMode = import.meta.env.VITE_API_MODE;
  if (envMode === "mock" || envMode === "proxy" || envMode === "direct") {
    return envMode;
  }

  const override = localStorage.getItem(API_MODE_KEY);
  if (override === "mock" || override === "proxy" || override === "direct") {
    return override;
  }

  return "proxy";
}

export function getMockDelay(): number {
  const raw = import.meta.env.VITE_API_MOCK_DELAY;
  const parsed = raw ? Number(raw) : 300;
  return Number.isFinite(parsed) ? parsed : 300;
}

export function setApiMode(mode: "mock" | "proxy" | "direct"): void {
  sessionStorage.setItem(API_MODE_KEY, mode);
  localStorage.setItem(API_MODE_KEY, mode);
}

export function clearApiModeOverride(): void {
  sessionStorage.removeItem(API_MODE_KEY);
  localStorage.removeItem(API_MODE_KEY);
}
