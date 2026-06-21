/** Beeant-style proxy RPC response envelope. */
export interface IResponse<T = unknown> {
  Status: boolean;
  Code: string;
  Message: string;
  Data: T;
  Timestamp?: number;
  TraceId?: string;
  Sign?: string;
}

/** Normalized result after adapter. */
export interface ApiResult<T = unknown> {
  ok: boolean;
  code: string;
  message: string;
  data: T;
  traceId?: string;
}

/** From GET /Home/Setting */
export interface ApiConfigSetting {
  Token: string;
  Urls: Record<string, string>;
  /** e.g. https://ronglv-feature.rongtrip.cn/Jyx/LoginByRyx */
  LoginUrl?: string;
  /** Tenant domain — Legacy `ApiConfig.Domain`, sent on every Proxy request. */
  Domain?: string;
}

export type ApiMode = "mock" | "proxy" | "direct";

export interface ProxySendOptions {
  method: string;
  data?: unknown;
  version?: string;
  url?: string;
  timeoutMs?: number;
  isForward?: boolean;
  /** Beeant Identity GetWebSocketUrl: no Sign/Token on form body */
  skipSign?: boolean;
  isShowLoading?: boolean;
}
