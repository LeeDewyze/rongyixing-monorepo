import { getApi } from "@/lib/api";
import { withAppBasePath } from "@/lib/base-path";
import { clearSession, saveLoginResult, setTicket, setTicketName } from "@/lib/session";

const TICKET_PARAM = "ticket";
const TICKET_NAME_PARAM = "ticketName";
const LEGACY_TICKET_NAME_PARAM = "ticketname";
const TICKET_ENTRY_HOME_PATH = "/home";
const TICKET_ENTRY_LOGIN_PATH = "/login/password";
const EXTERNAL_TICKET_ERROR_KEY = "ryx_external_ticket_error";
export const EXTERNAL_TICKET_LOGIN_ERROR_MESSAGE =
  "系统没有找到您有效的单点登录账户信息，这可能是您没有注册或注册了多个账户导致的";

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

export function resolveTicketEntryTargetPath(_url: URL): string {
  return TICKET_ENTRY_HOME_PATH;
}

function replaceLocation(path: string): void {
  window.history.replaceState(window.history.state, "", withAppBasePath(path));
}

function replaceTicketEntryLogin(): void {
  replaceLocation(TICKET_ENTRY_LOGIN_PATH);
}

function saveExternalTicketError(message: string): void {
  sessionStorage.setItem(EXTERNAL_TICKET_ERROR_KEY, message);
}

export function takePendingExternalTicketError(): string | null {
  const message = sessionStorage.getItem(EXTERNAL_TICKET_ERROR_KEY)?.trim() || null;
  sessionStorage.removeItem(EXTERNAL_TICKET_ERROR_KEY);
  return message;
}

function usePageTicketDirectly(url: URL, ticket: string): void {
  const targetPath = resolveTicketEntryTargetPath(url);
  const ticketName = readTicketNameParam(url);

  clearSession();
  setTicket(ticket);
  if (ticketName) {
    setTicketName(ticketName);
  }
  replaceLocation(targetPath);
}

/** Exchange SSO-style `?ticket=...` for the normal RongYiXing local session. */
export async function bootstrapExternalTicket(): Promise<void> {
  const url = new URL(window.location.href);
  const ticket = normalizeExternalTicket(url.searchParams.get(TICKET_PARAM));
  if (!ticket) return;
  if (!shouldBootstrapExternalTicket(url)) {
    usePageTicketDirectly(url, ticket);
    return;
  }

  const targetPath = resolveTicketEntryTargetPath(url);

  clearSession();
  replaceLocation(targetPath);

  try {
    const api = getApi();
    const loginResult = await api.authProxy.rybLogin({ ticket });
    if (!loginResult.Ticket) {
      throw new Error(EXTERNAL_TICKET_LOGIN_ERROR_MESSAGE);
    }

    saveLoginResult(loginResult);
  } catch (error) {
    console.warn("[ryx] external ticket login failed", error);
    clearSession();
    saveExternalTicketError(EXTERNAL_TICKET_LOGIN_ERROR_MESSAGE);
    replaceTicketEntryLogin();
  }
}
