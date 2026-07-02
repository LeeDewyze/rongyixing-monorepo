import type { HomeBanner } from "@ryx/shared-types";

import { asArray, asRecord, readNumber, readString } from "./legacy-parse.js";

function readImageUrl(record: Record<string, unknown>): string | undefined {
  const value =
    readString(record.ImageUrl) ||
    readString(record.imageUrl) ||
    readString(record.ImgUrl) ||
    readString(record.imgUrl);
  return value.trim() || undefined;
}

function readBannerId(record: Record<string, unknown>): string | number | undefined {
  const textId = readString(record.Id) || readString(record.id);
  if (textId) return textId;
  const numericId = readNumber(record.Id) ?? readNumber(record.id);
  return numericId !== undefined ? String(numericId) : undefined;
}

function normalizeBannerItem(raw: unknown): HomeBanner | null {
  let item = raw;
  if (typeof item === "string") {
    try {
      item = JSON.parse(item) as unknown;
    } catch {
      return null;
    }
  }

  const record = asRecord(item);
  if (!record) return null;

  const imageUrl = readImageUrl(record);
  if (!imageUrl) return null;

  return {
    Id: readBannerId(record),
    Title: readString(record.Title) || readString(record.title) || undefined,
    ImageUrl: imageUrl,
    Url: (record.Url ?? record.url) as HomeBanner["Url"],
    ...(readString(record.Name) || readString(record.name)
      ? { Name: readString(record.Name) || readString(record.name) }
      : {}),
    ...(readString(record.Tag) || readString(record.tag)
      ? { Tag: readString(record.Tag) || readString(record.tag) }
      : {}),
  };
}

/** Normalize `TmcApiHomeUrl-Banner-List` payloads (array, JSON string, or camelCase keys). */
export function normalizeBannerList(raw: unknown): HomeBanner[] {
  let payload = raw;
  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload) as unknown;
    } catch {
      return [];
    }
  }

  return asArray<unknown>(payload)
    .map(normalizeBannerItem)
    .filter((banner): banner is HomeBanner => banner !== null);
}
