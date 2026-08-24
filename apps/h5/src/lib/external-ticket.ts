import { getApi } from "@/lib/api";
import { withAppBasePath } from "@/lib/base-path";
import { hasDingTalkCode, readDingTalkCode } from "@/lib/dingtalk";
import {
  clearSession,
  getTicket,
  saveLoginResult,
  setTicket,
  setTicketName,
  setTmcId,
} from "@/lib/session";

const TICKET_PARAM = "ticket";
const TICKET_NAME_PARAM = "ticketName";
const LEGACY_TICKET_NAME_PARAM = "ticketname";
const TICKET_ENTRY_HOME_PATH = "/home";
const TICKET_ENTRY_LOGIN_PATH = "/login/password";
const EXTERNAL_TICKET_ERROR_KEY = "ryx_external_ticket_error";
const TMC_ID_QUERY_KEYS = ["tmcid", "TmcId", "tmcId", "TMCId"];
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
    hasDingTalkCode(url.searchParams)
  );
}

export function resolveDingTalkBindingPath(url: URL): string {
  const params = new URLSearchParams(url.search);
  params.delete(TICKET_NAME_PARAM);
  params.delete(LEGACY_TICKET_NAME_PARAM);
  params.delete("returnTo");
  const query = params.toString();
  console.info("[ryx][dingtalk] binding callback matched; using fixed binding page", {
    path: url.searchParams.get("path"),
    hasCode: hasDingTalkCode(url.searchParams),
  });
  return `/settings/dingtalk${query ? `?${query}` : ""}`;
}

export function shouldBootstrapExternalTicket(url: URL, userAgent = currentUserAgent()): boolean {
  return (
    !!readExternalTicket(url) && isOneMessageUserAgent(userAgent) && !isDingTalkTicketFlow(url)
  );
}

export function shouldUsePageTicketDirectly(url: URL, userAgent = currentUserAgent()): boolean {
  return !!readExternalTicket(url) && !shouldBootstrapExternalTicket(url, userAgent);
}

function readTicketNameParam(url: URL): string {
  return (
    url.searchParams.get(TICKET_NAME_PARAM)?.trim() ||
    url.searchParams.get(LEGACY_TICKET_NAME_PARAM)?.trim() ||
    ""
  );
}

function readExternalTicket(url: URL): string {
  const ticketName = readTicketNameParam(url);
  const namedTicket = ticketName ? url.searchParams.get(ticketName) : null;
  return (
    normalizeExternalTicket(namedTicket) ||
    normalizeExternalTicket(url.searchParams.get(TICKET_PARAM))
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
  const dingTalkFlow = isDingTalkTicketFlow(url);
  const targetPath = dingTalkFlow
    ? resolveDingTalkBindingPath(url)
    : resolveTicketEntryTargetPath(url);
  const ticketName = readTicketNameParam(url);
  const existingTicket = getTicket();

  console.info("[ryx][dingtalk] legacy callback detected", {
    path: url.searchParams.get("path"),
    codeParameter: readDingTalkCode(url.searchParams)?.key || null,
    tmcid: url.searchParams.get("tmcid") || url.searchParams.get("TmcId"),
    hasIncomingTicket: !!ticket,
    hasExistingTicket: !!existingTicket,
    targetPath,
  });

  if (ticket) {
    clearSession();
    setTicket(ticket);
  } else if (!existingTicket) {
    clearSession();
  }
  if (ticketName) {
    setTicketName(ticketName);
  }
  replaceLocation(targetPath);
}

/** Persist an externally passed `?tmcid=` so the DingTalk bind flow can read it from storage. */
function persistExternalTmcId(url: URL): void {
  for (const key of TMC_ID_QUERY_KEYS) {
    const value = `${url.searchParams.get(key) ?? ""}`.trim();
    if (value) {
      setTmcId(value);
      return;
    }
  }
}

/** Exchange SSO-style `?ticket=...` for the normal RongYiXing local session. */
export async function bootstrapExternalTicket(): Promise<void> {
  const url = new URL(window.location.href);
  persistExternalTmcId(url);
  const ticket = readExternalTicket(url);
  if (isDingTalkTicketFlow(url)) {
    console.info("[ryx][dingtalk] bootstrap callback flow", {
      href: url.href,
      hasTicket: !!ticket,
    });
    usePageTicketDirectly(url, ticket);
    return;
  }
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
