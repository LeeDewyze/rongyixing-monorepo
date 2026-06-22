import { ApiError } from "@ryx/api";

import { getApiMode } from "@/lib/env";

/** Human-readable API failure for page-level error UI. */
export function formatApiError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code?.toLowerCase() === "nologin" || error.message.includes("登陆超时")) {
      return "登录已过期，请重新登录后再查询航班";
    }
    if (error.message.includes("没有获取列表")) {
      return "航班列表获取失败，请确认出发/到达城市后重试；若仍失败请联系管理员";
    }
    if (error.message.includes("没有获取详情") || error.message.includes("舱位")) {
      return "舱位信息获取失败，请返回列表重新选择航班";
    }
    if (error.status === 501 || error.message.includes("501")) {
      return `接口未实现 (HTTP 501)。当前为 ${getApiMode()} 模式，机票 Mock 请切到 Mock 模式（右下角 DEV 按钮）。`;
    }
    if (error.code === "MOCK_NOT_FOUND") {
      return `${error.message}。请重启 dev 服务或执行 pnpm build:workspace。`;
    }
    return error.message || "请求失败";
  }
  if (error instanceof Error) {
    if (error.message.includes("flight")) {
      return `${error.message}。请执行 pnpm build:workspace 后重启 dev 服务。`;
    }
    return error.message;
  }
  return "加载失败";
}
