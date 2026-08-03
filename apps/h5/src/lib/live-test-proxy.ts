import crypto from "node:crypto";

export const LIVE_TEST_USER = "T18610773065";
export const LIVE_TEST_PASS = "Temp123456";
export const LIVE_TEST_BASE = "http://app.rtesp.com";
export const LIVE_TEST_APP_ID = "com.ronglvonline.app";

function md5(value: string): string {
  return crypto.createHash("md5").update(value).digest("hex");
}

function getTimestamp(): number {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  const cnMs = utcMs + 8 * 3_600_000;
  return Math.floor(cnMs / 1000);
}

export async function fetchLiveToken(): Promise<string> {
  const settingRes = await fetch(
    `${LIVE_TEST_BASE}/Home/Setting?appId=${encodeURIComponent(LIVE_TEST_APP_ID)}`,
  );
  const settingJson = (await settingRes.json()) as {
    Data?: { Token?: string };
    Token?: string;
  };
  const token = settingJson.Data?.Token ?? settingJson.Token ?? "";
  if (!token) throw new Error("未获取到 API Token");
  return token;
}

export async function liveProxyRequest<T>(
  token: string,
  method: string,
  data: Record<string, unknown>,
  options: {
    ticket?: string;
    requestFields?: Record<string, string | number | boolean>;
  } = {},
): Promise<T> {
  const payload = JSON.stringify(data);
  const timestamp = getTimestamp();
  const sign = md5(`${payload}${timestamp}${token}`);
  const body = new URLSearchParams({
    Method: method,
    Data: payload,
    Timestamp: String(timestamp),
    Token: token,
    Sign: sign,
    Language: "cn",
    Ticket: options.ticket ?? "",
    TicketName: "",
    Domain: "rtesp.com",
    "x-requested-with": "XMLHttpRequest",
  });
  for (const [key, value] of Object.entries(options.requestFields ?? {})) {
    body.set(key, String(value));
  }

  const response = await fetch(`${LIVE_TEST_BASE}/Home/Proxy`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const text = await response.text();
  if (!text.trim()) throw new Error(`${method} 响应为空 (HTTP ${response.status})`);
  return JSON.parse(text) as T;
}

export async function liveProxyLogin(token: string, device = "h5-live-test"): Promise<string> {
  const loginJson = await liveProxyRequest<{
    Data?: { Ticket?: string };
    Ticket?: string;
  }>(token, "ApiLoginUrl-Home-Login", {
    Name: LIVE_TEST_USER,
    Password: LIVE_TEST_PASS,
    Device: device,
    DeviceName: device,
    LoginType: "H5",
  });
  const ticket = loginJson.Data?.Ticket ?? loginJson.Ticket ?? "";
  if (!ticket) throw new Error(`登录失败: ${JSON.stringify(loginJson).slice(0, 300)}`);
  return ticket;
}
