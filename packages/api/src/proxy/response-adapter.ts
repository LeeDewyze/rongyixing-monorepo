import type { ApiResult, IResponse } from "@ryx/shared-types";

import { ApiError } from "../errors.js";

const FAILURE_MESSAGES_BY_CODE: Record<string, string> = {
  validate: "校验失败，请检查输入内容",
  nologin: "登录已过期，请重新登录",
  noauthorize: "暂无操作权限",
  systemerror: "系统繁忙，请稍后重试",
};

function resolveFailureMessage(response: IResponse<unknown>): string {
  const message = response.Message?.trim();
  if (message) return message;

  const code = response.Code?.trim().toLowerCase();
  if (code && FAILURE_MESSAGES_BY_CODE[code]) {
    return FAILURE_MESSAGES_BY_CODE[code];
  }

  return "请求失败";
}

export function adaptResponse<T>(response: IResponse<T>): ApiResult<T> {
  return {
    ok: response.Status,
    code: response.Code,
    message: response.Message,
    data: response.Data,
    traceId: response.TraceId,
  };
}

export function assertSuccess<T>(response: IResponse<T>): T {
  if (!response.Status) {
    throw new ApiError(resolveFailureMessage(response), 200, response.Code || undefined);
  }
  return response.Data;
}

export function successResponse<T>(data: T, message = ""): IResponse<T> {
  return {
    Status: true,
    Code: "success",
    Message: message,
    Data: data,
  };
}

export function errorResponse(code: string, message: string): IResponse<null> {
  return {
    Status: false,
    Code: code,
    Message: message,
    Data: null,
  };
}
