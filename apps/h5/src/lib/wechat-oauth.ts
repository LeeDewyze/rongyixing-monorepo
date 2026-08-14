import { stripAppBasePath } from "@/lib/base-path";

const WECHAT_OPEN_ID_KEY = "wechatopenid";
const PENDING_PAY_URL_KEY = "ryx_wechat_pending_pay_url";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function normalizeOpenId(value: string | null | undefined): string {
  const normalized = `${value ?? ""}`.trim();
  return normalized && normalized !== "null" && normalized !== "undefined" ? normalized : "";
}

function currentUrl(): URL | null {
  if (typeof window === "undefined" || !window.location?.href) return null;
  return new URL(window.location.href);
}

function readCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const prefix = `${name}=`;
  const cookie = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix));
  if (!cookie) return "";
  try {
    return normalizeOpenId(decodeURIComponent(cookie.slice(prefix.length)));
  } catch {
    return normalizeOpenId(cookie.slice(prefix.length));
  }
}

function writeOpenIdStorage(openid: string): void {
  try {
    localStorage.setItem(WECHAT_OPEN_ID_KEY, openid);
  } catch {
    // Ignore storage restrictions in embedded WebViews.
  }
  try {
    sessionStorage.setItem(WECHAT_OPEN_ID_KEY, openid);
  } catch {
    // Ignore storage restrictions in embedded WebViews.
  }
  if (typeof document !== "undefined") {
    document.cookie = `${WECHAT_OPEN_ID_KEY}=${encodeURIComponent(openid)}; path=/; max-age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
  }
}

function readStoredOpenId(): string {
  try {
    const local = normalizeOpenId(localStorage.getItem(WECHAT_OPEN_ID_KEY));
    if (local) return local;
  } catch {
    // Ignore storage restrictions in embedded WebViews.
  }
  try {
    const session = normalizeOpenId(sessionStorage.getItem(WECHAT_OPEN_ID_KEY));
    if (session) return session;
  } catch {
    // Ignore storage restrictions in embedded WebViews.
  }
  return readCookie(WECHAT_OPEN_ID_KEY);
}

function removeSearchKeys(params: URLSearchParams, keys: string[]): void {
  const lowerKeys = new Set(keys.map((key) => key.toLowerCase()));
  for (const key of [...params.keys()]) {
    if (lowerKeys.has(key.toLowerCase())) params.delete(key);
  }
}

function relativeLocation(url: URL): string {
  return `${url.pathname}${url.search}${url.hash}`;
}

function readPendingPayUrl(): string {
  try {
    return sessionStorage.getItem(PENDING_PAY_URL_KEY) ?? "";
  } catch {
    return "";
  }
}

function clearPendingPayUrl(): void {
  try {
    sessionStorage.removeItem(PENDING_PAY_URL_KEY);
  } catch {
    // Ignore storage restrictions in embedded WebViews.
  }
}

function savePendingPayUrl(url: URL): void {
  try {
    sessionStorage.setItem(PENDING_PAY_URL_KEY, relativeLocation(url));
  } catch {
    // Ignore storage restrictions in embedded WebViews.
  }
}

export function isWechatH5(
  userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent,
): boolean {
  if (!/micromessenger/i.test(userAgent)) return false;
  const wxEnvironment =
    typeof window === "undefined"
      ? undefined
      : (window as unknown as Record<string, unknown>)["__wxjs_environment"];
  return wxEnvironment !== "miniprogram";
}

/** Legacy-compatible OpenID lookup: query string, cookie, then local WebView storage. */
export function getWechatOpenId(url = currentUrl()): string {
  const fromQuery = normalizeOpenId(url?.searchParams.get(WECHAT_OPEN_ID_KEY));
  return fromQuery || readCookie(WECHAT_OPEN_ID_KEY) || readStoredOpenId();
}

export function buildWechatOAuthUrl(input: {
  appBaseUrl: string;
  domain: string;
  ticket: string;
  ticketName: string;
  currentUrl: URL;
}): string {
  const params = new URLSearchParams(input.currentUrl.search);
  removeSearchKeys(params, [WECHAT_OPEN_ID_KEY, "openid", "domain", "path", "ticket"]);
  removeSearchKeys(params, [input.ticketName]);
  params.set("domain", input.domain);
  params.set(input.ticketName || "ticket", input.ticket);
  params.set("path", stripAppBasePath(input.currentUrl.pathname).replace(/^\/+/, ""));
  return `${input.appBaseUrl.replace(/\/$/, "")}/home/GetWechatCode?${params.toString()}`;
}

/** Redirect to the legacy OAuth endpoint and remember the exact SPA payment URL. */
export function redirectToWechatOAuth(input: {
  appBaseUrl: string;
  domain: string;
  ticket: string;
  ticketName: string;
}): void {
  const url = currentUrl();
  if (!url || typeof window === "undefined") return;
  savePendingPayUrl(url);
  window.location.assign(
    buildWechatOAuthUrl({
      ...input,
      currentUrl: url,
    }),
  );
}

/** Consume the OAuth callback before React Router starts, then restore the pending payment page. */
export function bootstrapWechatOAuthCallback(): boolean {
  const url = currentUrl();
  if (!url) return false;

  const openid = normalizeOpenId(url.searchParams.get(WECHAT_OPEN_ID_KEY));
  if (!openid) return false;
  writeOpenIdStorage(openid);

  const pending = readPendingPayUrl();
  clearPendingPayUrl();
  const target = pending ? new URL(pending, url.origin) : url;
  if (pending && target.origin !== url.origin) return false;
  target.searchParams.delete(WECHAT_OPEN_ID_KEY);
  window.history.replaceState(window.history.state, "", relativeLocation(target));
  return true;
}
