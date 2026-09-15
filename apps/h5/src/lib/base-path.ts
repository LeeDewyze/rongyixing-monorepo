function normalizeBasePath(value: string | undefined): string {
  const raw = value?.trim();
  if (!raw || raw === "/") return "";
  if (raw === "." || raw === "./") return "";
  return `/${raw.replace(/^\/+|\/+$/g, "")}`;
}

export function getRouterBasename(): string {
  return normalizeBasePath(import.meta.env.BASE_URL);
}

export function stripAppBasePath(path: string): string {
  const base = getRouterBasename();
  if (!path) return "/";
  if (!base) return path;
  if (path === base) return "/";
  if (path.startsWith(`${base}/`)) return path.slice(base.length) || "/";
  if (path.startsWith(`${base}?`) || path.startsWith(`${base}#`)) {
    return `/${path.slice(base.length)}`;
  }
  return path;
}

export function withAppBasePath(path: string): string {
  const base = getRouterBasename();
  if (!base) return path;
  if (/^[a-z][a-z\d+\-.]*:/i.test(path) || path.startsWith("//")) return path;

  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === base || normalized.startsWith(`${base}/`)) return normalized;
  if (normalized === "/") return `${base}/`;
  return `${base}${normalized}`;
}

export function resolveInternalReturnTo(
  returnTo: string | null | undefined,
  fallback: string,
): string {
  if (!returnTo || !returnTo.startsWith("/") || returnTo.startsWith("//")) return fallback;

  const normalized = stripAppBasePath(returnTo);
  if (!normalized.startsWith("/") || normalized.startsWith("//")) return fallback;
  if (normalized === "/login" || normalized.startsWith("/login/")) return fallback;
  return normalized;
}
