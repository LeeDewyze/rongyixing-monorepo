const DEVICE_ID_KEY = "ryx_device_id";

const QUERY_SKIP = new Set([
  "wechatcode",
  "wechatminicode",
  "dingtalkcode",
  "language",
  "ticket",
  "ticketname",
  "wechatopenid",
  "dingtalkopenid",
  "style",
  "path",
  "domain",
]);

/** Product root for proxy form body (beeant `root`, e.g. `rl`). Not the SPA route segment. */
export function getApiRoot(): string {
  const fromQuery = readQueryParams().get("root");
  if (fromQuery) {
    return fromQuery;
  }
  const fromEnv = import.meta.env.VITE_API_ROOT?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  return "rl";
}

function readQueryParams(): URLSearchParams {
  return new URLSearchParams(globalThis.location?.search ?? "");
}

/** Stable H5 device id (beeant Device field). */
export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID().replace(/-/g, "")
        : `h5${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function getDeviceName(): string {
  return import.meta.env.VITE_DEV_DEVICE_NAME ?? "H5 Browser";
}

export function getRequestDomain(): string {
  const fromUrl = readQueryParams().get("domain");
  if (fromUrl) return fromUrl;
  return import.meta.env.VITE_API_DOMAIN ?? "rtesp.com";
}

export function getRequestLanguage(): string {
  const fromUrl = readQueryParams().get("language");
  if (fromUrl) return fromUrl;
  return import.meta.env.VITE_API_LANGUAGE ?? "cn";
}

export function getTicketName(): string {
  const params = readQueryParams();
  const name = params.get("ticketName") ?? localStorage.getItem("ticketName");
  return !name || name === "null" ? "ticket" : name;
}

/** URL query fields merged into proxy form body (beeant RequestEntity). */
export function getRequestExtraFields(): Record<string, string> {
  const params = readQueryParams();
  const ticketName = getTicketName().toLowerCase();
  const extras: Record<string, string> = {};

  for (const [key, value] of params.entries()) {
    const lower = key.toLowerCase();
    if (QUERY_SKIP.has(lower) || lower === ticketName || !value) {
      continue;
    }
    extras[key] = value;
  }

  const fromEnv = import.meta.env.VITE_PROXY_EXTRA_FIELDS;
  if (fromEnv) {
    for (const part of fromEnv.split("&")) {
      const [key, value] = part.split("=");
      if (key && value) {
        extras[key] = value;
      }
    }
  }

  if (!extras.root) {
    extras.root = getApiRoot();
  }

  return extras;
}
