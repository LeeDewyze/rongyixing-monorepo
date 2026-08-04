import { getApi } from "@/lib/api";
import { resolveInternalReturnTo, stripAppBasePath, withAppBasePath } from "@/lib/base-path";
import { getApiMode } from "@/lib/env";
import { startSessionGuard } from "@/lib/session-guard";
import {
  clearSession,
  saveLoginResult,
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

/** Exchange SSO-style `?ticket=...` for the normal RongYiXing local session. */
export async function bootstrapExternalTicket(fallbackPath = "/home"): Promise<void> {
  const url = new URL(window.location.href);
  const ticket = url.searchParams.get(TICKET_PARAM)?.trim();
  if (!ticket) return;

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
    replaceToLogin(targetPath);
  }
}
