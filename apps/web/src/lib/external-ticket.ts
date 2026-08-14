import { getApi } from "@/lib/api";
import { resolveInternalReturnTo, stripAppBasePath, withAppBasePath } from "@/lib/base-path";
import { clearSession, saveLoginResult, setTicket, setTicketName } from "@/lib/session";

const TICKET_PARAM = "ticket";
const TICKET_NAME_PARAM = "ticketName";
const LEGACY_TICKET_NAME_PARAM = "ticketname";

function currentUserAgent(): string {
  return typeof navigator === "undefined" ? "" : navigator.userAgent;
}

function normalizeExternalTicket(ticket: string | null): string {
  const normalized = `${ticket ?? ""}`.trim();
  if (!normalized || normalized === "null" || normalized === "undefined") return "";
  return normalized;
}

function isOneMessageUserAgent(userAgent: string): boolean {
  return /OneMessage/i.test(userAgent || "");
}

function isDingTalkTicketFlow(url: URL): boolean {
  const path = `${url.searchParams.get("path") ?? ""}`.trim().toLowerCase();
  return (
    path === "account-dingtalk" ||
    path.includes("account-dingtalk") ||
    url.searchParams.has("dingtalkcode") ||
    url.searchParams.has("DingTalkCode")
  );
}

export function shouldBootstrapExternalTicket(url: URL, userAgent = currentUserAgent()): boolean {
  return (
    !!normalizeExternalTicket(url.searchParams.get(TICKET_PARAM)) &&
    isOneMessageUserAgent(userAgent) &&
    !isDingTalkTicketFlow(url)
  );
}

export function shouldUsePageTicketDirectly(url: URL, userAgent = currentUserAgent()): boolean {
  return (
    !!normalizeExternalTicket(url.searchParams.get(TICKET_PARAM)) &&
    !shouldBootstrapExternalTicket(url, userAgent)
  );
}

function readTicketNameParam(url: URL): string {
  return (
    url.searchParams.get(TICKET_NAME_PARAM)?.trim() ||
    url.searchParams.get(LEGACY_TICKET_NAME_PARAM)?.trim() ||
    ""
  );
}

function cleanExternalTicketParams(url: URL): URL {
  const next = new URL(url.href);
  next.searchParams.delete(TICKET_PARAM);
  next.searchParams.delete(TICKET_NAME_PARAM);
  next.searchParams.delete(LEGACY_TICKET_NAME_PARAM);
  return next;
}

function buildInternalPath(url: URL): string {
  return stripAppBasePath(`${url.pathname}${url.search}${url.hash}`);
}

function resolveTicketTargetPath(url: URL, fallbackPath: string): string {
  const returnTo = url.searchParams.get("returnTo");
  if (returnTo) {
    return resolveInternalReturnTo(returnTo, fallbackPath);
  }

  const cleanUrl = cleanExternalTicketParams(url);
  const currentPath = buildInternalPath(cleanUrl);
  if (currentPath.startsWith("/login")) {
    return fallbackPath;
  }
  return resolveInternalReturnTo(currentPath, fallbackPath);
}

function replaceLocation(path: string): void {
  window.history.replaceState(window.history.state, "", withAppBasePath(path));
}

function replaceToLogin(returnTo: string): void {
  const path = `/login/password?returnTo=${encodeURIComponent(returnTo)}`;
  replaceLocation(path);
}

function usePageTicketDirectly(url: URL, ticket: string, fallbackPath: string): void {
  const targetPath = resolveTicketTargetPath(url, fallbackPath);
  const ticketName = readTicketNameParam(url);

  clearSession();
  setTicket(ticket);
  if (ticketName) {
    setTicketName(ticketName);
  }
  replaceLocation(targetPath);
}

/** Exchange SSO-style `?ticket=...` for the normal RongYiXing local session. */
export async function bootstrapExternalTicket(fallbackPath = "/"): Promise<void> {
  const url = new URL(window.location.href);
  const ticket = normalizeExternalTicket(url.searchParams.get(TICKET_PARAM));
  if (!ticket) return;
  if (!shouldBootstrapExternalTicket(url)) {
    usePageTicketDirectly(url, ticket, fallbackPath);
    return;
  }

  const targetPath = resolveTicketTargetPath(url, fallbackPath);

  clearSession();
  replaceLocation(targetPath);

  try {
    const api = getApi();
    const loginResult = await api.authProxy.rybLogin({ ticket });
    if (!loginResult.Ticket) {
      throw new Error("RYBLogin returned empty ticket");
    }

    saveLoginResult(loginResult);
  } catch (error) {
    console.warn("[ryx] external ticket login failed", error);
    clearSession();
    replaceToLogin(targetPath);
  }
}
