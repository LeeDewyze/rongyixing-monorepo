import { getAppBaseDomain } from "@/lib/env";

const DOMAIN_STORAGE_KEY = "ryx_domain";

/** Legacy `AppHelper.getDomain()` — tenant for Proxy RPC. */
export function getDomain(): string {
  const fromUrl = new URLSearchParams(window.location.search).get("domain");
  if (fromUrl?.trim()) {
    return fromUrl.trim();
  }

  const fromEnv = import.meta.env.VITE_API_DOMAIN;
  if (typeof fromEnv === "string" && fromEnv.trim() && fromEnv.trim() !== "__AUTO__") {
    return fromEnv.trim();
  }

  // Fallback when Setting not loaded — follow the configured app base host.
  return getAppBaseDomain();
}

export function persistDomain(domain: string): void {
  if (domain.trim()) {
    localStorage.setItem(DOMAIN_STORAGE_KEY, domain.trim());
  }
}
