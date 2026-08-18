import { isDingTalkUserAgent } from "@ryx/shared-types";

import { getApi } from "@/lib/api";
import { withAppBasePath } from "@/lib/base-path";
import { getDomain } from "@/lib/domain";
import { getLegacyAppBaseUrl } from "@/lib/env";
import { getTicket } from "@/lib/session";
import { getApiRoot, getTicketName } from "@/lib/request-context";

type DingTalkEntry = "login" | "bind";

function currentUserAgent(): string {
  return typeof navigator === "undefined" ? "" : navigator.userAgent;
}

export function isDingTalkContainer(): boolean {
  return isDingTalkUserAgent(currentUserAgent());
}

export async function isDingTalkEntryEnabled(entry: DingTalkEntry): Promise<boolean> {
  if (!isDingTalkContainer()) return false;
  if (entry === "login") return false;
  const configured = await getApi().proxy.loadApiConfig();
  return configured?.HasDingtalkBind === true;
}

function removeCodeFromUrl(): void {
  if (typeof window === "undefined" || !window.history?.replaceState) return;
  const url = new URL(window.location.href);
  url.searchParams.delete("dingtalkcode");
  url.searchParams.delete("DingTalkCode");
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

export function consumeDingTalkCode(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const code = params.get("dingtalkcode") ?? params.get("DingTalkCode");
  if (!code) return null;
  removeCodeFromUrl();
  return code.trim() || null;
}

export function buildDingTalkRedirectUrl(entry: DingTalkEntry, returnTo: string): string {
  const url = new URL(`${getLegacyAppBaseUrl()}/home/GetDingTalkCode`);
  url.searchParams.set("domain", getDomain());
  url.searchParams.set("path", entry === "login" ? "login" : "account-dingtalk");
  url.searchParams.set("returnTo", withAppBasePath(returnTo));
  url.searchParams.set("root", getApiRoot());
  const ticket = getTicket();
  if (entry === "bind" && ticket) {
    url.searchParams.set(getTicketName(), ticket);
  }
  const ticketName = getTicketName().toLowerCase();
  const excludedParams = new Set([
    "domain",
    "path",
    "islogin",
    "wechatcode",
    "dingtalkcode",
    "dingTalkCode".toLowerCase(),
    ticketName,
  ]);
  for (const [key, value] of new URLSearchParams(window.location.search)) {
    if (value && !excludedParams.has(key.toLowerCase()) && !url.searchParams.has(key)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

export async function requestDingTalkCode(
  entry: DingTalkEntry,
  returnTo: string,
): Promise<string | null> {
  window.location.assign(buildDingTalkRedirectUrl(entry, returnTo));
  return null;
}
