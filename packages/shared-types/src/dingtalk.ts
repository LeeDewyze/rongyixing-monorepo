export interface DingTalkEnvironment {
  isDingTalkH5: boolean;
  isSupported: boolean;
  reason?: "user-agent" | "container-api" | "config-disabled" | "unknown";
}

export interface DingTalkBindingItem {
  Id: string;
  Name: string;
}

export interface DingTalkLoginParams {
  Code: string;
  Device?: string;
  DeviceName?: string;
}

export interface DingTalkBindParams {
  Code: string;
}

export interface DingTalkRemoveParams {
  Id: string;
}

export interface DingTalkCheckResult {
  shouldBind: boolean;
  message?: string;
}

/** User-agent check kept pure so H5/Web can share the same environment rule. */
export function isDingTalkUserAgent(userAgent: string): boolean {
  return /dingtalk/i.test(userAgent);
}
