import { isDingTalkUserAgent } from "@ryx/shared-types";

import { getApi } from "@/lib/api";
import { withAppBasePath } from "@/lib/base-path";
import { getDomain } from "@/lib/domain";
import { getLegacyAppBaseUrl } from "@/lib/env";
import { getTmcId, getTicket, setTmcId } from "@/lib/session";
import { getApiRoot, getTicketName } from "@/lib/request-context";

type DingTalkEntry = "login" | "bind";

type DingTalkCodeParam = {
  key: string;
  value: string;
};

function findQueryParam(params: URLSearchParams, name: string): DingTalkCodeParam | null {
  const normalizedName = name.toLowerCase();
  for (const [key, value] of params) {
    if (key.toLowerCase() === normalizedName && value.trim()) {
      return { key, value: value.trim() };
    }
  }
  return null;
}

export function readDingTalkCode(params: URLSearchParams): DingTalkCodeParam | null {
  return findQueryParam(params, "dingtalkcode");
}

export function hasDingTalkCode(params: URLSearchParams): boolean {
  return readDingTalkCode(params) !== null;
}

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
  for (const key of [...url.searchParams.keys()]) {
    if (key.toLowerCase() === "dingtalkcode") url.searchParams.delete(key);
  }
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

export function consumeDingTalkCode(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const callback = readDingTalkCode(params);
  if (!callback) {
    console.info("[ryx][dingtalk] no callback code on current page");
    return null;
  }
  console.info("[ryx][dingtalk] consuming callback code", { parameter: callback.key });
  removeCodeFromUrl();
  return callback.value;
}

function normalizeTmcId(value: unknown): string | null {
  const normalized = `${value ?? ""}`.trim();
  return normalized || null;
}

function readUrlTmcId(): string | null {
  const params = new URLSearchParams(window.location.search);
  for (const key of ["tmcid", "TmcId", "tmcId", "TMCId"]) {
    const value = normalizeTmcId(params.get(key));
    if (value) return value;
  }
  return null;
}

function resolveTmcId(): { value: string | null; source: string } {
  const fromStorage = normalizeTmcId(getTmcId());
  if (fromStorage) return { value: fromStorage, source: "storage" };

  const fromUrl = readUrlTmcId();
  if (fromUrl) {
    setTmcId(fromUrl);
    return { value: fromUrl, source: "url" };
  }

  return { value: null, source: "missing" };
}

function resolveRequiredTmcId(): string {
  const initial = resolveTmcId();
  if (initial.value) {
    console.info("[ryx][dingtalk] tmcid resolved", {
      source: initial.source,
      tmcid: initial.value,
    });
    return initial.value;
  }
  console.error("[ryx][dingtalk] cannot start authorization: tmcid is required", {
    initialSource: initial.source,
    hasTicket: !!getTicket(),
  });
  throw new Error("钉钉授权缺少 TMCID，请刷新页面后重试");
}

export function buildDingTalkRedirectUrl(
  entry: DingTalkEntry,
  returnTo: string,
  requiredTmcId?: string,
): string {
  const url = new URL(`${getLegacyAppBaseUrl()}/home/GetDingTalkCode`);
  url.searchParams.set("domain", getDomain());
  url.searchParams.set("path", entry === "login" ? "login" : "account-dingtalk");
  if (entry === "login") {
    url.searchParams.set("returnTo", withAppBasePath(returnTo));
  }
  url.searchParams.set("root", getApiRoot());
  const tmcId = normalizeTmcId(requiredTmcId) ?? resolveRequiredTmcId();
  if (!tmcId) throw new Error("钉钉授权缺少 TMCID，请刷新页面后重试");
  url.searchParams.set("tmcid", tmcId);
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
    "tmcid",
    ticketName,
  ]);
  for (const [key, value] of new URLSearchParams(window.location.search)) {
    if (value && !excludedParams.has(key.toLowerCase()) && !url.searchParams.has(key)) {
      url.searchParams.set(key, value);
    }
  }
  console.info("[ryx][dingtalk] authorization URL built", {
    entry,
    path: url.pathname,
    root: url.searchParams.get("root"),
    tmcid: url.searchParams.get("tmcid"),
    hasTicket: !!url.searchParams.get(getTicketName()),
    returnTo: url.searchParams.get("returnTo"),
  });
  return url.toString();
}

export async function requestDingTalkCode(
  entry: DingTalkEntry,
  returnTo: string,
): Promise<string | null> {
  const tmcId = resolveRequiredTmcId();
  const redirectUrl = buildDingTalkRedirectUrl(entry, returnTo, tmcId);
  console.info("[ryx][dingtalk] redirecting to legacy authorization endpoint", redirectUrl);
  window.location.assign(redirectUrl);
  return null;
}
