import type { HomeBanner } from "@ryx/shared-types";

import { asArray, asRecord, readString } from "./legacy-parse.js";

function readImageUrl(record: Record<string, unknown>): string | undefined {
  const value =
    readString(record.ImageUrl) ||
    readString(record.imageUrl) ||
    readString(record.ImgUrl) ||
    readString(record.imgUrl);
  return value.trim() || undefined;
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
    Id: record.Id ?? record.id,
    Title: readString(record.Title) || readString(record.title) || undefined,
    Name: readString(record.Name) || readString(record.name) || undefined,
    ImageUrl: imageUrl,
    Url: (record.Url ?? record.url) as HomeBanner["Url"],
    Tag: readString(record.Tag) || readString(record.tag) || undefined,
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
