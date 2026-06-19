import { AUTH_METHODS } from "./auth.js";
import { OTHER_METHODS } from "./other.js";

/** Curated S1 auth / identity flow Methods. */
export const AUTH_FLOW_METHODS = {
  DEVICE_LOGIN: AUTH_METHODS.HOME_DEVICELOGIN,
  LOGOUT: AUTH_METHODS.HOME_LOGOUT,
  LOGIN: "ApiLoginUrl-Home-Login",
  MOBILE_LOGIN: "ApiLoginUrl-Home-MobileLogin",
  IDENTITY_GET: OTHER_METHODS.IDENTITY_GET,
  IDENTITY_CHECK: OTHER_METHODS.IDENTITY_CHECK,
  IDENTITY_WEBSOCKET: OTHER_METHODS.IDENTITY_GETWEBSOCKETURL,
} as const;

export type AuthFlowMethod =
  (typeof AUTH_FLOW_METHODS)[keyof typeof AUTH_FLOW_METHODS];
