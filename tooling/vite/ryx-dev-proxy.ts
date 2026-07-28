export interface RyxDevProxyOptions {
  apiBase: string;
  apiDomain?: string;
}

type ProxyEntry = {
  target: string;
  changeOrigin: boolean;
  secure?: boolean;
  rewrite?: (requestPath: string) => string;
};

type ProxyConfig = Record<string, string | ProxyEntry>;

const SERVICE_HOST_PREFIXES: Record<string, string> = {
  TmcApiHomeUrl: "api-tmc",
  TmcApiHotelUrl: "hotel-api-tmc",
  TmcApiFlightUrl: "flight-api-tmc",
  TmcApiTrainUrl: "train-api-tmc",
  TmcApiBookUrl: "book-api-tmc",
  TmcApiOrderUrl: "order-api-tmc",
  WorkflowApiUrl: "api-workflow",
  ApiMemberUrl: "member-api",
  ApiAccountUrl: "account-api",
  HrApiUrl: "api-hr",
  ApiPasswordUrl: "pass-api",
  ApiLoginUrl: "login-api",
  ApiHomeUrl: "api",
  FeatureRonglvUrl: "ronglv-feature",
  TmcTouristFlightUrl: "flight-tourist-tmc",
  TmcTouristTrainUrl: "train-tourist-tmc",
  TmcTouristHotelUrl: "hotel-tourist-tmc",
  TmcTouristBookUrl: "book-tourist-tmc",
  TmcTouristOrderUrl: "order-tourist-tmc",
};

function normalizeApiBase(value: string | undefined): string {
  const raw = value?.trim() || "https://app.rongtrip.cn";
  return raw.replace(/\/$/, "");
}

function normalizeDomain(value: string | undefined): string | undefined {
  const raw = value?.trim();
  if (!raw) return undefined;
  try {
    return new URL(raw).hostname;
  } catch {
    return raw.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  }
}

function deriveDomainFromApiBase(apiBase: string): string {
  try {
    const host = new URL(apiBase).hostname;
    if (host.startsWith("app.")) return host.slice("app.".length);
    const parts = host.split(".");
    return parts.length > 2 ? parts.slice(1).join(".") : host;
  } catch {
    return "rongtrip.cn";
  }
}

function serviceTarget(hostPrefix: string, domain: string): string {
  return `http://${hostPrefix}.${domain}`;
}

function createRyxServiceProxies(domain: string): ProxyConfig {
  const proxies: ProxyConfig = {};
  for (const [key, hostPrefix] of Object.entries(SERVICE_HOST_PREFIXES)) {
    const prefix = `/__ryx/${key}`;
    proxies[prefix] = {
      target: serviceTarget(hostPrefix, domain),
      changeOrigin: true,
      rewrite: (requestPath: string) => requestPath.slice(prefix.length) || "/",
    };
  }
  return proxies;
}

export function createRyxDevProxy({ apiBase, apiDomain }: RyxDevProxyOptions): ProxyConfig {
  const normalizedApiBase = normalizeApiBase(apiBase);
  const domain = normalizeDomain(apiDomain) ?? deriveDomainFromApiBase(normalizedApiBase);

  return {
    "/Home/Proxy": {
      target: normalizedApiBase,
      changeOrigin: true,
    },
    "/Home/Setting": {
      target: normalizedApiBase,
      changeOrigin: true,
    },
    "/legal-doc": {
      target: normalizedApiBase,
      changeOrigin: true,
      rewrite: (requestPath: string) => requestPath.replace(/^\/legal-doc/, "") || "/",
    },
    ...createRyxServiceProxies(domain),
    "/Identity": {
      target: serviceTarget("api", domain),
      changeOrigin: true,
    },
    "/Jyx": {
      target: serviceTarget("ronglv-feature", domain),
      changeOrigin: true,
      secure: true,
    },
  };
}
