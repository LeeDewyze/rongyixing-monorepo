const DEFAULT_APP_ID = "com.ronglvonline.app";

export function getAppName(): string {
  return import.meta.env.VITE_APP_NAME ?? "RongYiXing H5";
}

export function getAppId(): string {
  return import.meta.env.VITE_APP_ID?.trim() || DEFAULT_APP_ID;
}

export function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL ?? "";
  // Same-origin `/Home/*` in dev so Vite proxy avoids CORS.
  if (import.meta.env.DEV && getApiMode() !== "mock") {
    return "";
  }
  return configured;
}

const API_MODE_KEY = "ryx_api_mode";

export function getApiMode(): "mock" | "proxy" | "direct" {
  const override = localStorage.getItem(API_MODE_KEY);
  if (override === "mock" || override === "proxy" || override === "direct") {
    return override;
  }
  const envMode = import.meta.env.VITE_API_MODE;
  if (envMode === "mock" || envMode === "proxy" || envMode === "direct") {
    return envMode;
  }
  return "mock";
}

export function getMockDelay(): number {
  const raw = import.meta.env.VITE_API_MOCK_DELAY;
  const parsed = raw ? Number(raw) : 300;
  return Number.isFinite(parsed) ? parsed : 300;
}

export function setApiMode(mode: "mock" | "proxy" | "direct"): void {
  localStorage.setItem(API_MODE_KEY, mode);
}

export function clearApiModeOverride(): void {
  localStorage.removeItem(API_MODE_KEY);
}
