export function getAppName(): string {
  return import.meta.env.VITE_APP_NAME ?? "RongYiXing H5";
}

export function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL ?? "";
  // Dev + proxy: use same-origin /Home/* so Vite forwards to VITE_API_BASE_URL (avoids CORS).
  if (import.meta.env.DEV && getApiMode() === "proxy") {
    return "";
  }
  return configured;
}

const API_MODE_KEY = "ryx_api_mode";

export function getApiMode(): "mock" | "proxy" | "direct" {
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
  return "mock";
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
