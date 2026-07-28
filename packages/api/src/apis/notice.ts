import type { BulletinNotice, NoticeListParams } from "@ryx/shared-types";

import { TMC_METHODS } from "../methods/tmc.js";
import type { ProxyClient } from "../proxy/proxy-client.js";

export type { BulletinNotice, NoticeListParams };

export interface NoticeApi {
  getList(params?: NoticeListParams): Promise<BulletinNotice[]>;
  getDetail(params: { NoticeId: string | number }): Promise<BulletinNotice>;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalNoticeFields(
  record: Record<string, unknown>,
): Pick<BulletinNotice, "InsertTime" | "Description" | "Detail" | "FullFileName" | "Url"> {
  return {
    InsertTime: readString(record.InsertTime ?? record.insertTime) || undefined,
    Description: readString(record.Description ?? record.description) || undefined,
    Detail: readString(record.Detail ?? record.detail) || undefined,
    FullFileName: readString(record.FullFileName ?? record.fullFileName) || undefined,
    Url: readString(record.Url ?? record.url) || undefined,
  };
}

function normalizeNoticeItem(
  raw: unknown,
  options?: { requireTitle?: boolean },
): BulletinNotice | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const requireTitle = options?.requireTitle !== false;
  let title = readString(record.Title ?? record.title);
  const optional = readOptionalNoticeFields(record);
  if (!title) {
    title = optional.Description?.slice(0, 80) ?? "";
  }
  if (requireTitle && !title) return null;
  const id = record.Id ?? record.id;
  if (id == null || id === "") return null;
  return {
    Id: typeof id === "number" || typeof id === "string" ? id : String(id),
    Title: title || "通知",
    ...optional,
  };
}

export function normalizeNoticeList(raw: unknown): BulletinNotice[] {
  const items = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { Data?: unknown })?.Data)
      ? ((raw as { Data: unknown[] }).Data ?? [])
      : [];
  return items
    .map((item) => normalizeNoticeItem(item))
    .filter((item): item is BulletinNotice => item != null);
}

export function normalizeNoticeDetail(raw: unknown): BulletinNotice | null {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return normalizeNoticeItem(raw, { requireTitle: false });
  }
  const nested = (raw as { Data?: unknown })?.Data;
  if (nested && typeof nested === "object") {
    return normalizeNoticeItem(nested, { requireTitle: false });
  }
  return null;
}

export function createNoticeApi(proxy: ProxyClient): NoticeApi {
  return {
    async getList(params = {}) {
      const raw = await proxy.send<unknown>({
        method: TMC_METHODS.NOTICE_LIST,
        data: params,
      });
      return normalizeNoticeList(raw);
    },
    async getDetail(params) {
      const raw = await proxy.send<unknown>({
        method: TMC_METHODS.NOTICE_DETAIL,
        data: params,
      });
      return (
        normalizeNoticeDetail(raw) ?? {
          Id: params.NoticeId,
          Title: "",
        }
      );
    },
  };
}
