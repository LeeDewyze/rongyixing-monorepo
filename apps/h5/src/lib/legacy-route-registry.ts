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

registerAliases(["tab-tmc-home_ryx", "tabs_ryx", "tabs"], { pathname: "/home" });
registerAliases(["tab-tmc-trip_ryx"], { pathname: "/trips" });
registerAliases(["tab-tmc-my_ryx"], { pathname: "/home/mine" });

registerAliases(["tmc-flight-search", "tmc-flight-search_ryx"], {
  pathname: "/home",
  search: "?product=flight",
});
registerAliases(["tmc-train-search", "tmc-train-search_ryx"], {
  pathname: "/home",
  search: "?product=train",
});
registerAliases(["tmc-hotel-search", "tmc-hotel-search_ryx"], {
  pathname: "/home",
  search: "?product=hotel",
});

registerAliases(["tmc-hotel-list", "tmc-hotel-list_ryx"], { pathname: "/hotel" });
registerAliases(["tmc-flight-list", "tmc-flight-list_ryx"], { pathname: "/flight/list" });
registerAliases(["tmc-train-list", "tmc-train-list_ryx"], { pathname: "/train/list" });
registerAliases(["tmc-flight-book", "tmc-flight-book_ryx"], { pathname: "/flight/book" });
registerAliases(["tmc-train-book", "tmc-train-book_ryx"], { pathname: "/train/book" });

registerAliases(["tmc-order-list", "tmc-order-list_ryx"], { pathname: "/orders" });
registerAliases(["tmc-bulletin-list", "tmc-bulletin-list_ryx"], { pathname: "/notice" });
registerAliases(["tmc-approval-task"], { pathname: "/travel/approval" });
registerAliases(["gobusiness", "goBusiness"], { pathname: "/travel/apply" });
registerAliases(["tmc-select-passenger", "tmc-select-passenger_ryx"], {
  pathname: "/passenger/select",
});

registerAliases(["account-setting", "account-setting_ryx"], { pathname: "/settings" });
registerAliases(["account-security", "account-security_ryx"], { pathname: "/settings/security" });
registerAliases(["member-credential-list"], { pathname: "/credentials" });
registerAliases(["open-url"], { pathname: "/open-url" });

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

export function listLegacyRouteKeys(): string[] {
  return Object.keys(ROUTE_ENTRIES);
}
