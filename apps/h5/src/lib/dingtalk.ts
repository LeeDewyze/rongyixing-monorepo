import { isDingTalkUserAgent } from "@ryx/shared-types";

import { getApi } from "@/lib/api";
import { getLegacyAppBaseUrl } from "@/lib/env";
import { getTicket } from "@/lib/session";
import { getTicketName } from "@/lib/request-context";

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
  return configured?.HasDingtalkBind === true || import.meta.env.VITE_DINGTALK_ENABLE_BIND === "true";
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
  url.searchParams.set("domain", getLegacyAppBaseUrl().replace(/^https?:\/\//, ""));
  url.searchParams.set("path", entry === "login" ? "login" : "account-dingtalk");
  url.searchParams.set("returnTo", returnTo);
  const ticket = getTicket();
  if (entry === "bind" && ticket) {
    url.searchParams.set(getTicketName(), ticket);
  }
  return url.toString();
}

export async function requestDingTalkCode(
  entry: DingTalkEntry,
  returnTo: string,
): Promise<string | null> {
  const dd = (
    globalThis as typeof globalThis & {
      dd?: {
        runtime?: {
          permission?: {
            requestAuthCode?: (
              options: { corpId?: string },
              callback: (result: { code?: string; errCode?: string; errMsg?: string }) => void,
            ) => void;
          };
        };
      };
    }
  ).dd;
  const requestAuthCode = dd?.runtime?.permission?.requestAuthCode;
  if (requestAuthCode) {
    const code = await new Promise<string | null>((resolve) => {
      requestAuthCode({ corpId: import.meta.env.VITE_DINGTALK_CORP_ID }, (result) =>
        resolve(result.code?.trim() || null),
      );
    });
    return code;
  }
  window.location.assign(buildDingTalkRedirectUrl(entry, returnTo));
  return null;
}
