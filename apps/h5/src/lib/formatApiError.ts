import { ApiError } from "@ryx/api";

import { getApiMode } from "@/lib/env";

export type ApiErrorContext = "flight" | "train" | "hotel" | "generic";

const LIST_FETCH_FAILED: Record<ApiErrorContext, string> = {
  flight: "航班列表获取失败，请确认出发/到达城市后重试；若仍失败请联系管理员",
  train: "车次列表获取失败，请确认出发/到达站及日期后重试；若仍失败请联系管理员",
  hotel: "酒店列表获取失败，请确认城市及入住日期后重试；若仍失败请联系管理员",
  generic: "列表获取失败，请确认查询条件后重试；若仍失败请联系管理员",
};

const LOGIN_EXPIRED: Record<ApiErrorContext, string> = {
  flight: "登录已过期，请重新登录后再查询航班",
  train: "登录已过期，请重新登录后再查询车次",
  hotel: "登录已过期，请重新登录后再查询酒店",
  generic: "登录已过期，请重新登录",
};

/** Human-readable API failure for page-level error UI. */
export function formatApiError(error: unknown, context: ApiErrorContext = "generic"): string {
  if (error instanceof ApiError) {
    if (error.code?.toLowerCase() === "nologin" || error.message.includes("登陆超时")) {
      return LOGIN_EXPIRED[context];
    }
    if (error.message.includes("没有获取列表")) {
      return LIST_FETCH_FAILED[context];
    }
    if (
      context === "flight" &&
      (error.message.includes("没有获取详情") || error.message.includes("舱位"))
    ) {
      return "舱位信息获取失败，请返回列表重新选择航班";
    }
    if (error.status === 501 || error.message.includes("501")) {
      return `接口未实现 (HTTP 501)。当前为 ${getApiMode()} 模式，机票 Mock 请切到 Mock 模式（右下角 DEV 按钮）。`;
    }
    if (error.code === "MOCK_NOT_FOUND") {
      return `${error.message}。请重启 dev 服务或执行 pnpm build:workspace。`;
    }
    if (
      error.status === 502 ||
      error.status === 504 ||
      error.message.includes("502") ||
      error.message.includes("504")
    ) {
      return `测试环境接口不可达（HTTP ${error.status ?? "代理错误"}）。请检查网络/VPN，或在控制台执行 sessionStorage.setItem('ryx_api_mode','mock') 后刷新页面使用 Mock。`;
    }
    if (error.message === "Request failed") {
      return "请求失败，请稍后重试";
    }
    return error.message || "请求失败";
  }
  if (error instanceof Error) {
    if (error.message.includes("flight")) {
      return `${error.message}。请执行 pnpm build:workspace 后重启 dev 服务。`;
    }
    if (
      error.name === "AbortError" ||
      error.message.includes("Failed to fetch") ||
      error.message.includes("NetworkError") ||
      error.message.includes("ETIMEDOUT") ||
      error.message.includes("Unexpected token")
    ) {
      const mode = getApiMode();
      return `网络请求失败（${error.message}）。当前为 ${mode} 模式；若无法访问 rtesp 测试环境，请切到 Mock：sessionStorage.setItem('ryx_api_mode','mock') 后刷新。`;
    }
    return error.message;
  }
  return "加载失败";
}
