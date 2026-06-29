import type { NavigateFunction } from "react-router-dom";
import type { LegacyJumpTarget } from "@ryx/shared-types";

import { buildWorkflowOpenUrl } from "@/lib/approval-task-url";
import { resolveLegacyRoute } from "@/lib/legacy-route-registry";
import {
  getRequestDomain,
  getRequestExtraFields,
  getRequestLanguage,
  getTicketName,
} from "@/lib/request-context";
import { getTicket } from "@/lib/session";

const THEME_COLOR = "#2768FA";

export interface CoreJumpQuery {
  Name?: string;
  title?: string;
  isBlank?: boolean;
  isOpenInAppBrowser?: boolean;
  isHideTitle?: boolean;
  isEnableCheckIfCanBack?: boolean;
  isOpenAsModal?: boolean;
  url?: string;
  browserOpts?: Record<string, string>;
  [key: string]: unknown;
}

interface LegacyCheckResponse {
  Status?: boolean;
  Message?: string;
  Data?: Record<string, unknown>;
}

interface LegacyJumpInfo {
  path?: string;
  url?: string;
  checkUrl?: string;
  title?: string;
  isBlank?: boolean;
  isOpenInAppBrowser?: boolean;
  wechatMiniAppId?: string;
  wechatMiniPath?: string;
}

function getTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

function getFromQueryString(key: string, queryString: string): string {
  const params = new URLSearchParams(queryString);
  return params.get(key) ?? "";
}

function mergeUrlQueryIntoProps(url: string, props: CoreJumpQuery): void {
  const decoded = decodeURIComponent(url);
  if (!decoded.includes("?")) return;
  const queryString = decoded.split("?")[1] ?? "";
  for (const key of queryString
    .split("&")
    .map((part) => part.split("=")[0]?.trim())
    .filter(Boolean)) {
    props[key] = getFromQueryString(key, queryString);
  }
}

function buildCheckUrlPostBody(props: CoreJumpQuery): string {
  const ticket = getTicket() ?? "";
  const ticketName = getTicketName();
  const req: Record<string, string> = {
    Timestamp: String(getTimestamp()),
    Language: getRequestLanguage(),
    Ticket: ticket,
    TicketName: ticketName,
    Domain: getRequestDomain(),
    Data: JSON.stringify(props),
    ...Object.fromEntries(
      Object.entries(getRequestExtraFields()).map(([key, value]) => [key, value]),
    ),
  };
  if (ticketName !== "ticket") {
    req[ticketName] = ticket;
  }
  const formObj = Object.keys(req)
    .map((key) => `${key}=${encodeURIComponent(req[key] ?? "")}`)
    .join("&");
  return `${formObj}&x-requested-with=XMLHttpRequest`;
}

async function postCheckUrl(
  checkUrl: string,
  props: CoreJumpQuery,
): Promise<LegacyCheckResponse | null> {
  const url = checkUrl.includes("?") ? `${checkUrl}&ngsw-bypass` : `${checkUrl}?ngsw-bypass`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: buildCheckUrlPostBody(props),
    });
    return (await response.json()) as LegacyCheckResponse;
  } catch {
    return null;
  }
}

function buildOpenUrlSearch(url: string, props: CoreJumpQuery): string {
  const params = new URLSearchParams();
  const openUrl = url.includes("workflow.") ? buildWorkflowOpenUrl(url) : url;
  params.set("url", openUrl);
  if (props.title) params.set("title", String(props.title));
  if (props.Name) params.set("name", String(props.Name));
  if (props.isHideTitle != null) params.set("isHideTitle", String(props.isHideTitle));
  for (const [key, value] of Object.entries(props)) {
    if (value == null || typeof value === "object") continue;
    if (["url", "title", "name", "isHideTitle"].includes(key)) continue;
    params.set(key, String(value));
  }
  return params.toString();
}

async function handleHttpUrl(
  navigate: NavigateFunction,
  url: string,
  props: CoreJumpQuery,
): Promise<boolean> {
  mergeUrlQueryIntoProps(url, props);
  props.url = url;
  if (props.isHideTitle == null) {
    props.isHideTitle = true;
  }

  if (props.isOpenInAppBrowser || props.isBlank) {
    window.open(url, props.isBlank ? "_blank" : "_self");
    return true;
  }

  navigate(`/open-url?${buildOpenUrlSearch(url, props)}`);
  return true;
}

async function handlePathUrl(
  navigate: NavigateFunction,
  pathUrl: string,
  props: CoreJumpQuery,
): Promise<boolean> {
  const stripped = decodeURIComponent(pathUrl)
    .toLowerCase()
    .replace(/^path:\/\//, "");
  const queryIndex = stripped.indexOf("?");
  const pathOnly = queryIndex >= 0 ? stripped.substring(0, queryIndex) : stripped;
  const pathQuery: CoreJumpQuery = { ...props };
  if (queryIndex >= 0) {
    const queryString = stripped.substring(queryIndex + 1);
    for (const segment of queryString.split("&")) {
      const [key, value] = segment.split("=");
      if (key?.trim()) {
        pathQuery[key.trim()] = value?.trim() ?? "";
      }
    }
  }

  const resolved = resolveLegacyRoute(pathOnly);
  if (resolved) {
    const extra = new URLSearchParams(resolved.search?.replace(/^\?/, "") ?? "");
    for (const [key, value] of Object.entries(pathQuery)) {
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        extra.set(key, String(value));
      }
    }
    const search = extra.toString();
    navigate({ pathname: resolved.pathname, search: search ? `?${search}` : "" });
    return true;
  }

  if (typeof pathQuery.url === "string" && pathQuery.url.startsWith("http")) {
    return handleHttpUrl(navigate, pathQuery.url, pathQuery);
  }

  console.warn("[coreJump] unmapped legacy path:", pathOnly);
  navigate("/home");
  return false;
}

/** Port of legacy `CoreHelper.jump` for H5 react-router navigation. */
export async function coreJump(
  navigate: NavigateFunction,
  url: string,
  querys: CoreJumpQuery = {},
): Promise<boolean> {
  if (!url) return false;

  const props: CoreJumpQuery = { ...querys };

  if (url.toLowerCase().startsWith("json://")) {
    try {
      const jumpInfo = JSON.parse(url.substring("json://".length)) as LegacyJumpInfo;
      if (jumpInfo.checkUrl) {
        const checkResult = await postCheckUrl(jumpInfo.checkUrl, props);
        if (checkResult == null || !checkResult.Status) {
          window.alert(checkResult == null ? "请求异常" : checkResult.Message || "请求异常");
          return false;
        }
        if (checkResult.Data) {
          for (const key of Object.keys(checkResult.Data)) {
            props[key] = checkResult.Data[key];
          }
        }
      }

      if (jumpInfo.wechatMiniAppId?.trim() && jumpInfo.wechatMiniPath?.trim()) {
        if (import.meta.env.DEV) {
          console.warn("[coreJump] WeChat mini jump skipped in H5");
        }
        return false;
      }

      if (jumpInfo.path?.trim()) {
        url = jumpInfo.path.includes("path://") ? jumpInfo.path : `path://${jumpInfo.path.trim()}`;
      } else if (jumpInfo.url) {
        url = jumpInfo.url;
        if (jumpInfo.isBlank != null) props.isBlank = jumpInfo.isBlank;
        if (jumpInfo.isOpenInAppBrowser != null) {
          props.isOpenInAppBrowser = jumpInfo.isOpenInAppBrowser;
        }
      }
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  if (url.toLowerCase().startsWith("http://") || url.toLowerCase().startsWith("https://")) {
    return handleHttpUrl(navigate, url, props);
  }

  if (url.toLowerCase().startsWith("path://")) {
    return handlePathUrl(navigate, url, props);
  }

  return false;
}

/** Port of ryx home `onJump` — shared by banners and workbench. */
export async function onHomeBannerJump(
  navigate: NavigateFunction,
  target: LegacyJumpTarget,
): Promise<boolean> {
  try {
    if (!target?.Url) return false;

    let tmpUrlStr = "";
    let query: CoreJumpQuery = {};

    if (typeof target.Url === "object") {
      tmpUrlStr = `json://${JSON.stringify(target.Url)}`;
      query = { ...target.Url };
    } else {
      tmpUrlStr = target.Url;
    }

    const name = target.Name ?? target.Title;
    const isCheckin = name === "自助值机";

    return coreJump(navigate, tmpUrlStr, {
      Name: name,
      ...query,
      title: name,
      browserOpts: isCheckin
        ? {
            header_bar_title: name ?? "",
            show_header_bar: "yes",
            show_header_bar_back_arrow: "yes",
            show_header_bar_color: THEME_COLOR,
            show_header_bar_close_color: "#ffffff",
            show_header_bar_nav_btn_color: "#ffffff",
          }
        : undefined,
      isEnableCheckIfCanBack: false,
    });
  } catch (error) {
    console.error(error);
    window.alert(error instanceof Error ? error.message : String(error));
    return false;
  }
}
