import type { ApiResult, IResponse } from "@ryx/shared-types";

import { ApiError } from "../errors.js";

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
    throw new ApiError(response.Message || "Request failed", 200, response.Code);
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
