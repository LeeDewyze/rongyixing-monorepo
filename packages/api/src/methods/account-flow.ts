import { MEMBER_METHODS } from "./member.js";

/** Curated account settings / home Methods. */
export const ACCOUNT_FLOW_METHODS = {
  HOME_GET: MEMBER_METHODS.HOME_GET,
  HOME_GETITEMS: MEMBER_METHODS.HOME_GETITEMS,
  HOME_LOGOUT: MEMBER_METHODS.HOME_LOGOUT,
} as const;

export type AccountFlowMethod = (typeof ACCOUNT_FLOW_METHODS)[keyof typeof ACCOUNT_FLOW_METHODS];
