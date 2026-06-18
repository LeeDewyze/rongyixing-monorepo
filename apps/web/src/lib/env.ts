export function getAppName(): string {
  return import.meta.env.VITE_APP_NAME ?? "RongYiXing Web";
}

export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? "";
}
