import { getApi } from "@/lib/api";
import { resolveInternalReturnTo, stripAppBasePath, withAppBasePath } from "@/lib/base-path";
import { getApiMode } from "@/lib/env";
import {
  clearSession,
  saveLoginResult,
  setTicket,
  setTicketName,
  setWebSocketUrl,
} from "@/lib/session";

const TICKET_PARAM = "ticket";
const TICKET_NAME_PARAM = "ticketName";

function cleanExternalTicketParams(url: URL): URL {
  const next = new URL(url.href);
  next.searchParams.delete(TICKET_PARAM);
  next.searchParams.delete(TICKET_NAME_PARAM);
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
  if (currentPath === "/" || currentPath.startsWith("/login")) {
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

/** Accept SSO-style `?ticket=...` as one more source of the normal local session. */
export async function bootstrapExternalTicket(fallbackPath = "/home"): Promise<void> {
  const url = new URL(window.location.href);
  const ticket = url.searchParams.get(TICKET_PARAM)?.trim();
  if (!ticket) return;

  const targetPath = resolveTicketTargetPath(url, fallbackPath);
  const ticketName = url.searchParams.get(TICKET_NAME_PARAM)?.trim();

  setTicket(ticket);
  if (ticketName) {
    setTicketName(ticketName);
  }
  replaceLocation(targetPath);

  try {
    const api = getApi();
    const identity = await api.identity.get(ticket);
    saveLoginResult({
      Ticket: identity.Ticket || ticket,
      Id: identity.Id,
      Name: identity.Name,
      Token: identity.Token,
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
    }
  } catch (error) {
    console.warn("[ryx] external ticket: identity check failed", error);
    clearSession();
    replaceToLogin(targetPath);
  }
}
