export function getAppName(): string {
  return import.meta.env.VITE_APP_NAME ?? "RongYiXing H5";
}

export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? "";
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
