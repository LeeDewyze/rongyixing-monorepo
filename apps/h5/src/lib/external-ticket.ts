import { getApi } from "@/lib/api";
import { withAppBasePath } from "@/lib/base-path";
import { getApiMode } from "@/lib/env";
import { startSessionGuard } from "@/lib/session-guard";
import {
  clearSession,
  saveLoginResult,
  setTicket,
  setTicketName,
  setWebSocketUrl,
} from "@/lib/session";

const TICKET_PARAM = "ticket";
const TICKET_NAME_PARAM = "ticketName";
const LEGACY_TICKET_NAME_PARAM = "ticketname";
const TICKET_ENTRY_HOME_PATH = "/home";
const TICKET_ENTRY_LOGIN_PATH = "/login/password";

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

async function hydrateSessionFromTicket(ticket: string): Promise<void> {
  if (getApiMode() === "mock") return;
  const api = getApi();
  const identity = await api.identity.get(ticket);
  saveLoginResult({
    Ticket: identity.Ticket || ticket,
    Id: identity.Id,
    Name: identity.Name,
    Token: identity.Token,
  });

  try {
    const ws = await api.identity.getWebSocketUrl();
    if (ws?.Url) {
      setWebSocketUrl(ws.Url);
    }
  } catch (error) {
    console.warn("[ryx] page ticket: failed to load websocket url", error);
  }
  startSessionGuard();
}

async function usePageTicketDirectly(url: URL, ticket: string): Promise<void> {
  const targetPath = resolveTicketEntryTargetPath(url);
  const ticketName = readTicketNameParam(url);

  clearSession();
  setTicket(ticket);
  if (ticketName) {
    setTicketName(ticketName);
  }
  replaceLocation(targetPath);
  try {
    await hydrateSessionFromTicket(ticket);
  } catch (error) {
    console.warn("[ryx] page ticket: identity check failed", error);
    clearSession();
    replaceTicketEntryLogin();
  }
}

/** Exchange SSO-style `?ticket=...` for the normal RongYiXing local session. */
export async function bootstrapExternalTicket(): Promise<void> {
  const url = new URL(window.location.href);
  const ticket = normalizeExternalTicket(url.searchParams.get(TICKET_PARAM));
  if (!ticket) return;
  if (!shouldBootstrapExternalTicket(url)) {
    await usePageTicketDirectly(url, ticket);
    return;
  }

  const targetPath = resolveTicketEntryTargetPath(url);

  clearSession();
  replaceLocation(targetPath);

  try {
    const api = getApi();
    const loginResult = await api.authProxy.rybLogin({ ticket });
    if (!loginResult.Ticket) {
      throw new Error("RYBLogin returned empty ticket");
    }

    saveLoginResult(loginResult);

    const identity = await api.identity.get(loginResult.Ticket);
    saveLoginResult({
      Ticket: identity.Ticket || loginResult.Ticket,
      Id: identity.Id || loginResult.Id,
      Name: identity.Name || loginResult.Name,
      Token: identity.Token || loginResult.Token,
    });

    if (getApiMode() !== "mock") {
      try {
        const ws = await api.identity.getWebSocketUrl();
        if (ws?.Url) {
          setWebSocketUrl(ws.Url);
        }
      } catch (error) {
        console.warn("[ryx] external ticket: failed to load websocket url", error);
      }
      startSessionGuard();
    }
  } catch (error) {
    console.warn("[ryx] external ticket: identity check failed", error);
    clearSession();
    replaceTicketEntryLogin();
  }
}
