import type { IResponse } from "@ryx/shared-types";
import { AUTH_FLOW_METHODS, successResponse } from "@ryx/api";

import {
  mockIdentityGet,
  mockLoginSuccess,
} from "../fixtures/auth.js";

export function createAuthMockHandlers(): Record<
  string,
  (data: unknown) => IResponse<unknown>
> {
  return {
    [AUTH_FLOW_METHODS.DEVICE_LOGIN]: () => mockLoginSuccess(),
    [AUTH_FLOW_METHODS.LOGIN]: (data) => {
      const params = data as { Name?: string; Password?: string };
      if (params?.Password === "wrong") {
        return {
          Status: false,
          Code: "NOLOGIN",
          Message: "用户名或密码错误",
          Data: null,
        };
      }
      return mockLoginSuccess();
    },
    [AUTH_FLOW_METHODS.MOBILE_LOGIN]: () => mockLoginSuccess(),
    [AUTH_FLOW_METHODS.LOGOUT]: () => successResponse(true),
    [AUTH_FLOW_METHODS.IDENTITY_GET]: () => mockIdentityGet(),
    [AUTH_FLOW_METHODS.IDENTITY_CHECK]: () => successResponse(true),
    [AUTH_FLOW_METHODS.IDENTITY_WEBSOCKET]: () =>
      successResponse({ Url: "wss://mock.rongtrip.cn/ws" }),
  };
}

export { MOCK_IDENTITY, MOCK_LOGIN_RESULT } from "../fixtures/auth.js";
