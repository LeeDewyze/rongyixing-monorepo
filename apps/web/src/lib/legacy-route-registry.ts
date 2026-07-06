export interface LegacyRouteTarget {
  pathname: string;
  search?: string;
}

type RouteEntry = LegacyRouteTarget | ((query: Record<string, string>) => LegacyRouteTarget);

const ROUTE_ENTRIES: Record<string, RouteEntry> = {};

function registerRoute(legacyPath: string, target: RouteEntry): void {
  const key = legacyPath.toLowerCase();
  ROUTE_ENTRIES[key] = target;
}

function registerAliases(paths: string[], target: RouteEntry): void {
  for (const path of paths) {
    registerRoute(path, target);
  }
}

registerAliases(["tab-tmc-home_ryx", "tabs_ryx", "tabs"], { pathname: "/" });
registerAliases(["tab-tmc-trip_ryx"], { pathname: "/" });
registerAliases(["tab-tmc-my_ryx"], { pathname: "/mine" });

registerAliases(["tmc-flight-search", "tmc-flight-search_ryx"], {
  pathname: "/",
  search: "?product=flight",
});
registerAliases(["tmc-train-search", "tmc-train-search_ryx"], {
  pathname: "/",
  search: "?product=train",
});
registerAliases(["tmc-hotel-search", "tmc-hotel-search_ryx"], {
  pathname: "/",
  search: "?product=hotel",
});

registerAliases(["tmc-order-list", "tmc-order-list_ryx"], { pathname: "/orders" });

registerAliases(["login"], { pathname: "/login" });
registerAliases(["login/password"], { pathname: "/login/password" });

/** Mirrors ryx `AppHelper.getNormalizedPath`. */
export function getNormalizedLegacyPath(path: string): string {
  if (!path) return path;
  let value = decodeURIComponent(path);
  value = value.includes("?") ? value.split("?")[0]! : value;
  value = value.includes("#") ? value.split("#")[1]! : value;
  value = value.startsWith("/") ? value.substring(1) : value;
  return value.endsWith("/") ? value.substring(0, value.length - 1) : value;
}

/** Mirrors ryx `AppHelper.getRoutePath` skin suffix logic (without leading slash). */
export function normalizeLegacyRoutePath(path: string, style = "ryx"): string {
  if (!path) return path;
  let base = path;
  const queryIndex = base.indexOf("?");
  const query = queryIndex >= 0 ? base.substring(queryIndex) : "";
  if (query) {
    base = base.substring(0, queryIndex);
  }
  base = getNormalizedLegacyPath(base);
  const lastUnderscore = base.lastIndexOf("_");
  if (lastUnderscore !== -1) {
    base = base.substring(0, lastUnderscore);
  }
  if (base && style) {
    base = `${base}_${style}`;
  }
  return `${base}${query}`;
}

function parsePathQuery(pathWithQuery: string): { path: string; query: Record<string, string> } {
  const lower = decodeURIComponent(pathWithQuery).toLowerCase();
  const [pathPart, queryPart] = lower.split("?");
  const query: Record<string, string> = {};
  if (queryPart) {
    for (const segment of queryPart.split("&")) {
      const [key, value] = segment.split("=");
      if (key?.trim()) {
        query[key.trim()] = value?.trim() ?? "";
      }
    }
  }
  return { path: pathPart ?? "", query };
}

function resolveEntry(entry: RouteEntry, query: Record<string, string>): LegacyRouteTarget {
  if (typeof entry === "function") {
    return entry(query);
  }
  return entry;
}

export function resolveLegacyRoute(pathWithQuery: string): LegacyRouteTarget | undefined {
  const { path, query } = parsePathQuery(pathWithQuery);
  const candidates = [path, normalizeLegacyRoutePath(path), getNormalizedLegacyPath(path)];
  const seen = new Set<string>();
  for (const candidate of candidates) {
    const key = candidate.toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const entry = ROUTE_ENTRIES[key];
    if (entry) {
      return resolveEntry(entry, query);
    }
  }
  return undefined;
}
