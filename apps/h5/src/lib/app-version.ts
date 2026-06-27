/** Build label shown on settings page (from Vite define). */
export function getAppVersion(): string {
  return typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.0.0";
}
