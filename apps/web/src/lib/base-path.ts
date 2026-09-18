function normalizeBasePath(value: string | undefined): string {
  const raw = value?.trim();
  if (!raw || raw === "/") return "";
  if (raw === "." || raw === "./") return "";
  return `/${raw.replace(/^\/+|\/+$/g, "")}`;
}

export function getRouterBasename(): string {
  return normalizeBasePath(import.meta.env.BASE_URL);
}

function getStaticBasePath(): string {
  const base = getRouterBasename();
  return base ? `${base}/`.replace(/\/+/g, "/") : "/";
}

function normalizeHashRoutePath(path: string): string {
  const hashIndex = path.indexOf("#/");
  if (hashIndex < 0) return path;
  return path.slice(hashIndex + 1) || "/";
}

export function normalizeLegacyHistoryUrlToHash(): void {
  if (typeof window === "undefined" || window.location.hash.startsWith("#/")) return;

  const base = getRouterBasename();
  const pathname = window.location.pathname || "/";
  const routePath = base && pathname.startsWith(`${base}/`)
    ? pathname.slice(base.length) || "/"
    : pathname;
  const nextPath = routePath.startsWith("/") ? routePath : `/${routePath}`;
  const nextHash = `#${nextPath}${window.location.search}${window.location.hash}`;
  const staticPath = getStaticBasePath();

  if (pathname === staticPath && !window.location.search) return;
  window.history.replaceState(window.history.state, "", `${staticPath}${nextHash}`);
}

export function getCurrentAppUrl(): URL {
  const location = window.location;
  const current = new URL(
    location.href ||
      `${location.origin ?? "http://localhost"}${location.pathname ?? "/"}${location.search ?? ""}${location.hash ?? ""}`,
  );
  if (!current.hash.startsWith("#/")) return current;

  const hashUrl = new URL(`${current.origin}${current.hash.slice(1)}`);
  current.pathname = hashUrl.pathname;
  current.search = hashUrl.search;
  current.hash = "";
  return current;
}

export function withAppHashPath(path: string): string {
  const base = getStaticBasePath();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}#${normalized}`;
}

export function stripAppBasePath(path: string): string {
  const base = getRouterBasename();
  if (!path) return "/";
  const normalizedPath = normalizeHashRoutePath(path);
  if (normalizedPath !== path) return stripAppBasePath(normalizedPath);
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
