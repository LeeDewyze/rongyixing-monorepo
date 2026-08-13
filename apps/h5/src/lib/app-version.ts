/** Build label shown on settings page (from Vite define). */
export function getAppVersion(): string {
  const version = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__.trim() : "";
  if (!version) return "v0.0.0";
  return `v${version.replace(/^v/i, "")}`;
}
