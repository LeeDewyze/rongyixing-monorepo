/** Non-Proxy gateway paths (direct POST/GET to app base URL). */
export const GATEWAY_PATHS = {
  SETTING: "/Home/Setting",
  SEND_LOGIN_MOBILE_CODE: "/Home/SendLoginMobileCode",
  SEND_IDENTITY_MOBILE_CODE: "/Home/SendIdentityMobileCode",
  SEND_REGISTER_MOBILE_CODE: "/Home/SendRegisterMobileCode",
} as const;

export interface GatewayClientConfig {
  baseUrl: string;
  fetchImpl?: typeof fetch;
}

export interface SendMobileCodeParams {
  Mobile: string;
  ImageCode?: string;
  ImageValue?: string;
}

export interface GatewayClient {
  getSetting(appId?: string): Promise<unknown>;
  sendLoginMobileCode(params: SendMobileCodeParams): Promise<boolean>;
  sendIdentityMobileCode(params: SendMobileCodeParams): Promise<boolean>;
}

function normalizeBase(baseUrl: string): string {
  return baseUrl.replace(/\/$/, "");
}

export function createGatewayClient(config: GatewayClientConfig): GatewayClient {
  const fetchImpl = config.fetchImpl ?? globalThis.fetch.bind(globalThis);
  const base = normalizeBase(config.baseUrl);

  async function postJson<T>(path: string, body: unknown): Promise<T> {
    const response = await fetchImpl(`${base}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`Gateway request failed: HTTP ${response.status}`);
    }
    return (await response.json()) as T;
  }

  return {
    async getSetting(appId) {
      const query = appId ? `?appId=${encodeURIComponent(appId)}` : "";
      const response = await fetchImpl(`${base}${GATEWAY_PATHS.SETTING}${query}`);
      if (!response.ok) {
        throw new Error(`Failed to load setting: HTTP ${response.status}`);
      }
      return response.json();
    },

    async sendLoginMobileCode(params) {
      await postJson(GATEWAY_PATHS.SEND_LOGIN_MOBILE_CODE, params);
      return true;
    },

    async sendIdentityMobileCode(params) {
      await postJson(GATEWAY_PATHS.SEND_IDENTITY_MOBILE_CODE, params);
      return true;
    },
  };
}
