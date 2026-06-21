const API_CONFIG_STORAGE_KEY = "ryx_api_config";
const DOMAIN_STORAGE_KEY = "ryx_domain";

function readDomainFromApiConfig(): string | null {
  try {
    const raw = localStorage.getItem(API_CONFIG_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { Domain?: string; Data?: { Domain?: string } };
    return parsed.Domain ?? parsed.Data?.Domain ?? null;
  } catch {
    return null;
  }
}

/** Legacy `AppHelper.getDomain()` — tenant for Proxy RPC. */
export function getDomain(): string {
  const fromUrl = new URLSearchParams(window.location.search).get("domain");
  if (fromUrl?.trim()) {
    return fromUrl.trim();
  }

  const stored = localStorage.getItem(DOMAIN_STORAGE_KEY);
  if (stored?.trim()) {
    return stored.trim();
  }

  const fromConfig = readDomainFromApiConfig();
  if (fromConfig?.trim()) {
    return fromConfig.trim();
  }

  const fromEnv = import.meta.env.VITE_API_DOMAIN;
  if (typeof fromEnv === "string" && fromEnv.trim()) {
    return fromEnv.trim();
  }

  // Fallback when Setting not loaded — app.rtesp.com test env uses rtesp.com
  return "rtesp.com";
}

export function persistDomain(domain: string): void {
  if (domain.trim()) {
    localStorage.setItem(DOMAIN_STORAGE_KEY, domain.trim());
  }
}
