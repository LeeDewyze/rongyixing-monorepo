/** Build label shown on settings page (from Vite define). */
export function getAppVersion(): string {
  const version = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__.trim() : "";
  if (!version) return "0.0.0";
  if (/^[0-9a-f]{7,}$/i.test(version)) return `v${version}`;
  return version.startsWith("v") ? version : version;
}
