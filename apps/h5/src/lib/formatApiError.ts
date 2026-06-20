import { ApiError } from "@ryx/api";

import { getApiMode } from "@/lib/env";

/** Human-readable API failure for page-level error UI. */
export function formatApiError(error: unknown): string {
  if (error instanceof ApiError) {
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
