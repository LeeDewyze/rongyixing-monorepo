import crypto from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  buildTravelApplyBody,
  defaultTravelApplySegment,
  defaultTravelApplyTraveler,
  fetchTravelApplyMeta,
  submitTravelApply,
  type TravelApplyFormValues,
} from "./travel-apply";

const USER = "T18610773065";
const PASS = "Temp123456";
const BASE = "http://app.rtesp.com";
const APP_ID = "com.ronglvonline.app";

function md5(value: string): string {
  return crypto.createHash("md5").update(value).digest("hex");
}

function getTimestamp(): number {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  const cnMs = utcMs + 8 * 3_600_000;
  return Math.floor(cnMs / 1000);
}

async function proxyLogin(): Promise<string> {
  const settingRes = await fetch(`${BASE}/Home/Setting?appId=${encodeURIComponent(APP_ID)}`);
  const settingJson = (await settingRes.json()) as {
    Data?: { Token?: string };
    Token?: string;
  };
  const token = settingJson.Data?.Token ?? settingJson.Token ?? "";
  if (!token) throw new Error("未获取到 API Token");

  const data = JSON.stringify({
    Name: USER,
    Password: PASS,
    Device: "travel-apply-live",
    DeviceName: "travel-apply-live",
    LoginType: "H5",
  });
  const timestamp = getTimestamp();
  const sign = md5(`${data}${timestamp}${token}`);
  const body = new URLSearchParams({
    Method: "ApiLoginUrl-Home-Login",
    Data: data,
    Timestamp: String(timestamp),
    Token: token,
    Sign: sign,
    Language: "cn",
    Ticket: "",
    TicketName: "",
    Domain: "rtesp.com",
    "x-requested-with": "XMLHttpRequest",
  });

  const loginRes = await fetch(`${BASE}/Home/Proxy`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const loginText = await loginRes.text();
  if (!loginText.trim()) throw new Error(`登录响应为空 (HTTP ${loginRes.status})`);
  const loginJson = JSON.parse(loginText) as {
    Data?: { Ticket?: string; Name?: string };
    Ticket?: string;
  };
  const ticket = loginJson.Data?.Ticket ?? loginJson.Ticket ?? "";
  if (!ticket) throw new Error(`登录失败: ${loginText.slice(0, 300)}`);
  return ticket;
}

describe("travel apply live (staging)", () => {
  it(
    "submits multi-traveler multi-segment form for T18610773065",
    async () => {
      const ticket = await proxyLogin();
      const meta = await fetchTravelApplyMeta(ticket);

      expect(meta.staffOptions.length).toBeGreaterThan(0);
      expect(meta.cities.length).toBeGreaterThan(0);

      const secondStaff =
        meta.staffOptions.find((item) => item.value !== meta.defaultAccount.value) ??
        meta.staffOptions[1] ??
        meta.defaultAccount;

      const segmentA = defaultTravelApplySegment(meta.cities);
      const segmentB = {
        ...defaultTravelApplySegment(meta.cities),
        fromCity: segmentA.toCity,
        toCity: meta.cities.find((city) => city.value !== segmentA.toCity.value) ?? segmentA.fromCity,
      };

      const values: TravelApplyFormValues = {
        travelTypes: [meta.travelTypes[0]?.value ?? "国内机票"],
        reason: `H5多人多行程联调-${Date.now()}`,
        travelers: [
          defaultTravelApplyTraveler(meta.defaultAccount),
          { account: secondStaff },
        ],
        segments: [segmentA, segmentB],
      };

      const body = buildTravelApplyBody(meta, values);
      expect(body.get("FormDetails[6].SlaveRow")).toBe("0");
      expect(body.get("FormDetails[8].SlaveRow")).toBe("1");
      expect(body.get("FormTimes[2].SlaveRow")).toBe("1");

      const result = await submitTravelApply(meta, values);
      console.log("submit result:", JSON.stringify(result));

      expect(result.Status).toBe(true);
      expect(result.Data?.Id).toBeTruthy();
    },
    60_000,
  );
});
