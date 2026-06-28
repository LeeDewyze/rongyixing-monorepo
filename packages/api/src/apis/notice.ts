import { TMC_METHODS } from "../methods/tmc.js";
import type { ProxyClient } from "../proxy/proxy-client.js";
import { createRequestEntity, encodeFormBody, toFormFields } from "../proxy/request-entity.js";
import { computeSign, serializeData } from "../proxy/sign.js";

export interface BulletinNotice {
  Id: string | number;
  Title: string;
  InsertTime?: string;
  Url?: string;
}

export interface NoticeListParams {
  PageIndex?: number;
  PageSize?: number;
}

export interface NoticeApi {
  getList(params?: NoticeListParams): Promise<BulletinNotice[]>;
  getDetail(params: { NoticeId: string | number }): Promise<BulletinNotice>;
}

const NOTICE_API_BASE_URL = "http://api-tmc.rtesp.com";

function readQueryParams(): URLSearchParams {
  return new URLSearchParams(globalThis.location?.search ?? "");
}

function getRequestDomain(): string {
  const fromUrl = readQueryParams().get("domain");
  if (fromUrl) return fromUrl;
  return "rtesp.com";
}

function getRequestLanguage(): string {
  const fromUrl = readQueryParams().get("language");
  if (fromUrl) return fromUrl;
  return "cn";
}

function getApiRoot(): string {
  const fromQuery = readQueryParams().get("root");
  if (fromQuery) return fromQuery;
  return "rl";
}

function getRequestExtraFields(): Record<string, string> {
  return { root: getApiRoot() };
}

function unwrapNoticeList(payload: unknown): BulletinNotice[] {
  if (!payload || typeof payload !== "object") return [];
  const data = (payload as { Data?: unknown }).Data;
  return Array.isArray(data) ? (data as BulletinNotice[]) : [];
}

function unwrapNoticeDetail(payload: unknown): BulletinNotice | null {
  if (!payload || typeof payload !== "object") return null;
  const data = (payload as { Data?: unknown }).Data;
  return data && typeof data === "object" ? (data as BulletinNotice) : null;
}

function buildNoticeFormBody(
  method: string,
  data: unknown,
  proxy: ProxyClient,
  getTicket: () => string | null,
): string {
  const apiConfig = proxy.getApiConfig();
  const req = createRequestEntity(method, data, {
    getTicket,
    getTicketName: () => "ticket",
    getDomain: getRequestDomain,
    getLanguage: getRequestLanguage,
    getExtraFields: getRequestExtraFields,
    token: apiConfig?.Token ?? "",
  });
  const dataStr = serializeData(req.Data);
  const sign = computeSign(dataStr, req.Timestamp ?? 0, apiConfig?.Token ?? "");
  return encodeFormBody(toFormFields(req, sign, { includeSign: true, includeToken: true }));
}

export function createNoticeApi(proxy: ProxyClient): NoticeApi {
  return {
    async getList(params = {}) {
      const getTicket = () =>
        globalThis.localStorage?.getItem("ticket") ??
        globalThis.localStorage?.getItem("loginTicket") ??
        null;
      const response = await fetch(`${NOTICE_API_BASE_URL}/Notice/List`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: buildNoticeFormBody(TMC_METHODS.NOTICE_LIST, params, proxy, getTicket),
      });
      return unwrapNoticeList(await response.json());
    },
    async getDetail(params) {
      const getTicket = () =>
        globalThis.localStorage?.getItem("ticket") ??
        globalThis.localStorage?.getItem("loginTicket") ??
        null;
      const response = await fetch(`${NOTICE_API_BASE_URL}/Notice/Detail`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: buildNoticeFormBody(TMC_METHODS.NOTICE_DETAIL, params, proxy, getTicket),
      });
      return unwrapNoticeDetail(await response.json()) ?? (params as unknown as BulletinNotice);
    },
  };
}
