export function getAppName(): string {
  return import.meta.env.VITE_APP_NAME ?? "RongYiXing H5";
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
  localStorage.setItem("ryx_api_mode", mode);
}

export function clearApiModeOverride(): void {
  localStorage.removeItem("ryx_api_mode");
}

const DEFAULT_LOGIN_URL = "http://ronglv-feature.rtesp.com/Jyx/LoginByRyx";

/** Static ApiConfig from env — skips `GET /Home/Setting` when Token is set. */
export function getStaticApiConfig(): {
  Token: string;
  LoginUrl: string;
  Urls: Record<string, string>;
} | null {
  const token = import.meta.env.VITE_API_TOKEN?.trim();
  if (!token) return null;
  const loginUrl = import.meta.env.VITE_LOGIN_URL?.trim() || DEFAULT_LOGIN_URL;
  return { Token: token, LoginUrl: loginUrl, Urls: {} };
}

export function hasStaticApiConfig(): boolean {
  return getStaticApiConfig() !== null;
}
