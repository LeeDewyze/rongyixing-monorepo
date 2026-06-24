import type {
  HotelBookParams,
  HotelBookResponse,
  HotelCity,
  HotelCityResourceResponse,
  HotelDetailParams,
  HotelDetailResponse,
  HotelInitBookParams,
  HotelInitBookResponse,
  HotelListItem,
  HotelListParams,
  HotelListResponse,
  HotelPolicyParams,
  HotelPolicyResponse,
} from "@ryx/shared-types";

import { normalizeEntityKeys } from "./flight-detail-adapter.js";
import { HOTEL_FLOW_METHODS } from "../methods/hotel-flow.js";
import { TMC_METHODS } from "../methods/tmc.js";
import type { ProxyClient } from "../proxy/proxy-client.js";

export interface HotelApi {
  getCities(): Promise<HotelCity[]>;
  getList(params: HotelListParams): Promise<HotelListResponse>;
  getDetail(params: HotelDetailParams): Promise<HotelDetailResponse>;
  getPolicy(params: HotelPolicyParams): Promise<HotelPolicyResponse>;
  initBook(params: HotelInitBookParams): Promise<HotelInitBookResponse>;
  submitBook(params: HotelBookParams): Promise<HotelBookResponse>;
}

type HotelCityLine = HotelCity & {
  CityName?: string;
};

type LegacyHotelEntity = {
  Id?: string;
  Name?: string;
  Address?: string;
  Category?: string | number;
  AvgPrice?: number | string;
  Variables?: unknown;
  VariablesObj?: Record<string, unknown>;
  FileName?: string;
  FullFileName?: string;
  Tag?: string;
};

type LegacyHotelDayPrice = {
  Hotel?: LegacyHotelEntity;
  MinPrice?: number | string;
  AvgPrice?: number | string;
};

function toPrice(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const n = typeof value === "number" ? value : Number.parseFloat(String(value));
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/** Legacy RoomPlan.SupplierNumber is often an opaque supplier key string, not a price. */
function toLegacySupplierNumber(value: unknown): string | number | undefined {
  if (value == null || value === "") return undefined;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = String(value).trim();
  return text || undefined;
}

function parseVariablesObject(variables: unknown): Record<string, unknown> | undefined {
  let current: unknown = variables;
  for (let depth = 0; depth < 2; depth += 1) {
    if (!current) return undefined;
    if (typeof current === "object") return current as Record<string, unknown>;
    if (typeof current !== "string") return undefined;
    try {
      current = JSON.parse(current) as unknown;
    } catch {
      return undefined;
    }
  }
  return typeof current === "object" && current != null
    ? (current as Record<string, unknown>)
    : undefined;
}

/** Legacy getAvgPrice: VariablesObj.AvgPrice only. */
function getHotelVariablesAvgPrice(hotel: LegacyHotelEntity): number | undefined {
  const vars = hotel.VariablesObj ?? parseVariablesObject(hotel.Variables);
  if (!vars) return undefined;
  return toPrice(vars.AvgPrice ?? vars.avgPrice);
}

function parseHotelListPrice(item: LegacyHotelDayPrice): number | undefined {
  const hotel = item.Hotel ?? {};
  // Item AvgPrice matches legacy goToDetail(hotelprice: item.AvgPrice) and is the
  // authoritative list quote when present; Variables/hotel.AvgPrice are fallbacks.
  return toPrice(item.AvgPrice) ?? getHotelVariablesAvgPrice(hotel) ?? toPrice(hotel.AvgPrice);
}

function parseHotelStar(category: string | number | undefined): number | undefined {
  if (category == null || category === "") return undefined;
  const value = typeof category === "number" ? category : Number.parseFloat(String(category));
  if (!Number.isFinite(value) || value <= 0) return undefined;
  if (value >= 5) return 5;
  return Math.round(value);
}

function mapLegacyHotelDayPrice(item: LegacyHotelDayPrice): HotelListItem | null {
  const hotel = item.Hotel;
  if (!hotel?.Id && !hotel?.Name) return null;
  const tags = hotel.Tag
    ? hotel.Tag.split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : undefined;
  return {
    HotelId: hotel.Id ?? "",
    HotelName: hotel.Name ?? "",
    Address: hotel.Address,
    Star: parseHotelStar(hotel.Category),
    MinPrice: parseHotelListPrice(item),
    ImageUrl: hotel.FullFileName ?? hotel.FileName,
    Tags: tags,
  };
}

function normalizeHotelListResponse(res: unknown): HotelListResponse {
  if (!res || typeof res !== "object") {
    return { Hotels: [] };
  }
  const payload = res as Record<string, unknown>;
  if (Array.isArray(payload.Hotels)) {
    return payload as unknown as HotelListResponse;
  }
  const legacyItems = payload.HotelSearchResultDtoList ?? payload.HotelDayPrices;
  if (Array.isArray(legacyItems)) {
    const hotels = (legacyItems as LegacyHotelDayPrice[])
      .map(mapLegacyHotelDayPrice)
      .filter((item): item is HotelListItem => Boolean(item?.HotelId && item.HotelName));
    const total =
      typeof payload.DataCount === "number"
        ? payload.DataCount
        : typeof payload.TotalCount === "number"
          ? payload.TotalCount
          : hotels.length;
    return { Hotels: hotels, TotalCount: total };
  }
  return { Hotels: [] };
}

type LegacyImageLocation = {
  Url?: string;
  SizeType?: number | string;
};

type LegacyHotelImage = {
  ImageUrl?: string;
  FullFileName?: string;
  FileName?: string;
  ThumbNailUrl?: string;
  Room?: { Id?: string | number; RoomId?: string | number } | string | number;
  RoomId?: string | number;
  OwnerId?: string | number;
  OwnerType?: string | number;
  Type?: string | number;
  ImageType?: string | number;
  IsRoomCoverImage?: boolean | string;
  Locations?: LegacyImageLocation[];
};

type LegacyRoomPlan = {
  Id?: string;
  Name?: string;
  TotalAmount?: number | string;
  SalesPrice?: number | string;
  Number?: number | string;
  SupplierNumber?: number | string;
  SupplierType?: number | string;
  BeginDate?: string;
  EndDate?: string;
  Variables?: unknown;
  VariablesObj?: Record<string, unknown>;
  RoomPlanPrices?: { Price?: number | string }[];
  RoomPlanRules?: { Description?: string }[];
  Room?: { Id?: string };
};

type LegacyRoomDetail = {
  Name?: string;
  Description?: string;
  Tag?: string;
};

type LegacyRoom = {
  Id?: string | number;
  RoomId?: string | number;
  Name?: string;
  FileName?: string;
  FullFileName?: string;
  ImageUrl?: string;
  ThumbNailUrl?: string;
  Variables?: unknown;
  VariablesObj?: Record<string, unknown>;
  Images?: (LegacyHotelImage | string)[];
  RoomDetails?: LegacyRoomDetail[];
  RoomPlans?: LegacyRoomPlan[];
};

type LegacyHotelDetailItem = {
  Tag?: string;
  Name?: string;
  Description?: string;
};

type LegacyHotelDetailEntity = LegacyHotelEntity & {
  Phone?: string;
  Lat?: number | string;
  Lng?: number | string;
  HotelImages?: LegacyHotelImage[];
  Images?: (LegacyHotelImage | string)[];
  HotelDetails?: LegacyHotelDetailItem[];
  Rooms?: LegacyRoom[];
  ArrivalTime?: number | string;
  DepartureTime?: number | string;
  CheckInTime?: number | string;
  CheckOutTime?: number | string;
  EstablishmentDate?: string;
  RenovationDate?: string;
  OpenDate?: string;
  FixDate?: string;
  StartBusinessDate?: string;
  Description?: string;
  Intro?: string;
  IntroEditor?: string;
  Brief?: string;
  Features?: string;
  BookingNotice?: string;
  ReservationNotice?: string;
  Notice?: string;
  PrepayRules?: string;
  HotelNotice?: string;
};

type ResolvedHotelInfoFields = {
  CheckInOutTime?: string;
  BookingNotice?: string;
  OpeningDate?: string;
  RenovationDate?: string;
  Introduction?: string;
};

function pickLegacyText(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (value == null) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return undefined;
}

function formatLegacyHotelDate(value: unknown): string | undefined {
  const text = pickLegacyText(value);
  if (!text || text.startsWith("1900")) return undefined;
  if (/^\d{4}-\d{2}$/.test(text)) return `${text}-01`;
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  return text;
}

function stripHotelInfoHtml(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeHotelInfoText(value: unknown): string | undefined {
  const text = pickLegacyText(value);
  if (!text) return undefined;
  return stripHotelInfoHtml(text);
}

function groupLegacyHotelDetailsByTag(
  items: LegacyHotelDetailItem[] | undefined,
): Record<string, string> {
  if (!items?.length) return {};
  const grouped: Record<string, string[]> = {};
  for (const item of items) {
    const tag = item.Tag?.trim();
    const desc = item.Description?.trim();
    if (!tag || !desc) continue;
    if (!grouped[tag]) grouped[tag] = [];
    const lower = desc.toLowerCase();
    if (!grouped[tag].some((value) => value.toLowerCase() === lower)) {
      grouped[tag].push(desc);
    }
  }
  const result: Record<string, string> = {};
  for (const [tag, descriptions] of Object.entries(grouped)) {
    result[tag] = descriptions.join(" | ");
  }
  return result;
}

function findHotelDetailDescriptionByName(
  items: LegacyHotelDetailItem[] | undefined,
  name: string,
): string | undefined {
  if (!items?.length) return undefined;
  const matches: string[] = [];
  for (const item of items) {
    if (item.Name?.trim() !== name) continue;
    const desc = item.Description?.trim();
    if (!desc) continue;
    const lower = desc.toLowerCase();
    if (!matches.some((value) => value.toLowerCase() === lower)) {
      matches.push(desc);
    }
  }
  return matches.length ? matches.join(" | ") : undefined;
}

function formatHotelDetailTimeDesc(desc: string, kind: "checkIn" | "checkOut"): string {
  const text = desc.trim();
  if (!text) return "";
  const legacySuffix = kind === "checkIn" ? "之后" : "之前";
  if (
    text.includes("入住") ||
    text.includes("离店") ||
    text.includes("以后") ||
    text.includes("以前") ||
    text.includes("之后") ||
    text.includes("之前")
  ) {
    return text;
  }
  if (text.includes("点")) {
    return text.endsWith("之后") || text.endsWith("以前") ? text : `${text}${legacySuffix}`;
  }
  return formatLegacyHotelTimeHint(text, kind) ?? `${text}点${legacySuffix}`;
}

function mapCheckInOutFromHotelDetails(
  grouped: Record<string, string>,
  items: LegacyHotelDetailItem[],
): string | undefined {
  const parts: string[] = [];
  const arrival = grouped.ArrivalTime;
  const departure = grouped.DepartureTime;
  if (arrival) parts.push(`入住时间：${formatHotelDetailTimeDesc(arrival, "checkIn")}`);
  if (departure) parts.push(`离店时间：${formatHotelDetailTimeDesc(departure, "checkOut")}`);
  if (parts.length) return parts.join(" ");

  const byName = normalizeHotelInfoText(findHotelDetailDescriptionByName(items, "入离时间"));
  if (byName) return byName;

  const dida = grouped.DidaCheckInOut;
  return dida ? normalizeHotelInfoText(dida) : undefined;
}

function resolveHotelInfoFieldsFromHotelDetails(
  hotelDetails: LegacyHotelDetailItem[] | undefined,
): ResolvedHotelInfoFields {
  if (!hotelDetails?.length) return {};
  const grouped = groupLegacyHotelDetailsByTag(hotelDetails);

  return {
    CheckInOutTime: mapCheckInOutFromHotelDetails(grouped, hotelDetails),
    BookingNotice: normalizeHotelInfoText(
      pickLegacyText(
        grouped.Reminder,
        grouped.BookingNotice,
        grouped.ReservationNotice,
        grouped.PrepayRules,
        grouped.HotelNotice,
        findHotelDetailDescriptionByName(hotelDetails, "预订须知"),
      ),
    ),
    OpeningDate: formatLegacyHotelDate(
      pickLegacyText(
        grouped.EstablishmentDate,
        grouped.OpenDate,
        grouped.StartBusinessDate,
        findHotelDetailDescriptionByName(hotelDetails, "开业时间"),
      ),
    ),
    RenovationDate: formatLegacyHotelDate(
      pickLegacyText(
        grouped.RenovationDate,
        grouped.FixDate,
        findHotelDetailDescriptionByName(hotelDetails, "装修时间"),
      ),
    ),
    Introduction: normalizeHotelInfoText(
      pickLegacyText(
        grouped.IntroEditor,
        grouped.Features,
        grouped.Brief,
        findHotelDetailDescriptionByName(hotelDetails, "简介"),
      ),
    ),
  };
}

function resolveHotelInfoFields(hotel: LegacyHotelDetailEntity): ResolvedHotelInfoFields {
  const fromDetails = resolveHotelInfoFieldsFromHotelDetails(hotel.HotelDetails);
  return {
    CheckInOutTime: fromDetails.CheckInOutTime ?? mapLegacyCheckInOutTimeFromScalars(hotel),
    BookingNotice: fromDetails.BookingNotice ?? mapLegacyBookingNoticeFromScalars(hotel),
    OpeningDate: fromDetails.OpeningDate ?? mapLegacyOpeningDateFromScalars(hotel),
    RenovationDate: fromDetails.RenovationDate ?? mapLegacyRenovationDateFromScalars(hotel),
    Introduction: fromDetails.Introduction ?? mapLegacyIntroductionFromScalars(hotel),
  };
}

function formatLegacyHotelTimeHint(
  value: unknown,
  kind: "checkIn" | "checkOut",
): string | undefined {
  const text = pickLegacyText(value);
  if (!text) return undefined;
  if (
    text.includes("入住") ||
    text.includes("离店") ||
    text.includes("以后") ||
    text.includes("以前")
  ) {
    return text;
  }
  if (/^\d{1,2}:\d{2}/.test(text)) {
    return kind === "checkIn" ? `${text}以后` : `${text}以前`;
  }
  const hour = Number.parseInt(text, 10);
  if (Number.isFinite(hour) && hour >= 0 && hour <= 23) {
    const clock = `${String(hour).padStart(2, "0")}:00`;
    return kind === "checkIn" ? `${clock}以后` : `${clock}以前`;
  }
  return text;
}

function mapLegacyCheckInOutTimeFromScalars(hotel: LegacyHotelDetailEntity): string | undefined {
  const vars = hotel.VariablesObj ?? parseVariablesObject(hotel.Variables);
  const checkIn = formatLegacyHotelTimeHint(
    pickLegacyText(
      hotel.ArrivalTime,
      hotel.CheckInTime,
      vars?.ArrivalTime,
      vars?.CheckInTime,
      vars?.arrivalTime,
      vars?.checkInTime,
    ),
    "checkIn",
  );
  const checkOut = formatLegacyHotelTimeHint(
    pickLegacyText(
      hotel.DepartureTime,
      hotel.CheckOutTime,
      vars?.DepartureTime,
      vars?.CheckOutTime,
      vars?.departureTime,
      vars?.checkOutTime,
    ),
    "checkOut",
  );
  const parts: string[] = [];
  if (checkIn) parts.push(`入住时间：${checkIn}`);
  if (checkOut) parts.push(`离店时间：${checkOut}`);
  return parts.length ? parts.join(" ") : undefined;
}

function mapLegacyBookingNoticeFromScalars(hotel: LegacyHotelDetailEntity): string | undefined {
  const vars = hotel.VariablesObj ?? parseVariablesObject(hotel.Variables);
  return pickLegacyText(
    hotel.BookingNotice,
    hotel.ReservationNotice,
    hotel.Notice,
    hotel.PrepayRules,
    hotel.HotelNotice,
    vars?.BookingNotice,
    vars?.ReservationNotice,
    vars?.Notice,
    vars?.PrepayRules,
    vars?.HotelNotice,
  );
}

function mapLegacyIntroductionFromScalars(hotel: LegacyHotelDetailEntity): string | undefined {
  const vars = hotel.VariablesObj ?? parseVariablesObject(hotel.Variables);
  return pickLegacyText(
    hotel.IntroEditor,
    hotel.Description,
    hotel.Intro,
    hotel.Brief,
    hotel.Features,
    vars?.IntroEditor,
    vars?.Description,
    vars?.Intro,
    vars?.Brief,
    vars?.Features,
  );
}

function mapLegacyOpeningDateFromScalars(hotel: LegacyHotelDetailEntity): string | undefined {
  const vars = hotel.VariablesObj ?? parseVariablesObject(hotel.Variables);
  return formatLegacyHotelDate(
    pickLegacyText(
      hotel.EstablishmentDate,
      hotel.OpenDate,
      hotel.StartBusinessDate,
      vars?.EstablishmentDate,
      vars?.OpenDate,
      vars?.StartBusinessDate,
    ),
  );
}

function mapLegacyRenovationDateFromScalars(hotel: LegacyHotelDetailEntity): string | undefined {
  const vars = hotel.VariablesObj ?? parseVariablesObject(hotel.Variables);
  return formatLegacyHotelDate(
    pickLegacyText(hotel.RenovationDate, hotel.FixDate, vars?.RenovationDate, vars?.FixDate),
  );
}

function getRoomPlanUniqueId(plan: LegacyRoomPlan): string | undefined {
  const vars = plan.VariablesObj ?? parseVariablesObject(plan.Variables);
  const id = vars?.RoomPlanUniqueId;
  return id != null && String(id).trim() ? String(id) : undefined;
}

function getPlanAvgPrice(plan: LegacyRoomPlan): number | undefined {
  const vars = plan.VariablesObj ?? parseVariablesObject(plan.Variables);
  const fromVars = toPrice(vars?.AvgPrice ?? vars?.avgPrice);
  if (fromVars !== undefined) return fromVars;
  const total = toPrice(plan.TotalAmount ?? plan.SalesPrice);
  if (total !== undefined) return total;
  const prices = (plan.RoomPlanPrices ?? [])
    .map((item) => toPrice(item.Price))
    .filter((value): value is number => value !== undefined);
  if (!prices.length) return undefined;
  return prices.reduce((sum, value) => sum + value, 0) / prices.length;
}

function getPlanBreakfast(plan: LegacyRoomPlan): string | undefined {
  const vars = plan.VariablesObj ?? parseVariablesObject(plan.Variables);
  const breakfast = vars?.Breakfast;
  return breakfast != null ? String(breakfast) : undefined;
}

function getPlanCancelPolicy(plan: LegacyRoomPlan): string | undefined {
  const rules = (plan.RoomPlanRules ?? []).map((item) => item.Description?.trim()).filter(Boolean);
  if (rules.length) return rules.join("，");
  const vars = plan.VariablesObj ?? parseVariablesObject(plan.Variables);
  const rateRule = vars?.RoomRateRule;
  return rateRule != null ? String(rateRule) : undefined;
}

/** Legacy shared room placeholder when a room has no photos. */
export const LEGACY_HOTEL_ROOM_DEFAULT_IMAGE = "http://shared.rtesp.com/img/roomDefault.png";

function resolveRoomDefaultImg(payload: Record<string, unknown>): string | undefined {
  return pickLegacyText(payload.RoomDefaultImg, LEGACY_HOTEL_ROOM_DEFAULT_IMAGE);
}

function resolveLegacyImageUrl(source: {
  ImageUrl?: string;
  FullFileName?: string;
  FileName?: string;
  ThumbNailUrl?: string;
}): string | undefined {
  const url = source.ImageUrl ?? source.FullFileName ?? source.FileName ?? source.ThumbNailUrl;
  if (url == null) return undefined;
  const trimmed = String(url).trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  return trimmed;
}

/** Elong guest-room image type in legacy HotelImages[]. */
const LEGACY_ROOM_IMAGE_TYPE = 8;

function isLegacyRoomOwnerType(ownerType: string | number | undefined): boolean {
  if (ownerType == null) return false;
  const normalized = String(ownerType).trim().toLowerCase();
  return normalized === "2" || normalized === "room";
}

function isLegacyHotelOwnerType(ownerType: string | number | undefined): boolean {
  if (ownerType == null) return false;
  const normalized = String(ownerType).trim().toLowerCase();
  return normalized === "1" || normalized === "hotel";
}

function isLegacyRoomImageType(type: string | number | undefined): boolean {
  if (type == null) return false;
  return Number(type) === LEGACY_ROOM_IMAGE_TYPE;
}

function normalizeLegacyEntityId(value: unknown): string | undefined {
  if (value == null) return undefined;
  const normalized = String(value).trim();
  if (!normalized || normalized === "0" || normalized === "-1") return undefined;
  return normalized;
}

function isLegacyRoomCoverImage(image: LegacyHotelImage): boolean {
  return image.IsRoomCoverImage === true || String(image.IsRoomCoverImage).toLowerCase() === "true";
}

function getLegacyImageRoomId(image: LegacyHotelImage): string | undefined {
  const roomId = normalizeLegacyEntityId(image.RoomId);
  if (roomId) return roomId;

  if (image.OwnerId != null && String(image.OwnerId).trim() !== "") {
    if (isLegacyRoomOwnerType(image.OwnerType) || !isLegacyHotelOwnerType(image.OwnerType)) {
      if (
        isLegacyRoomOwnerType(image.OwnerType) ||
        isLegacyRoomImageType(image.Type ?? image.ImageType) ||
        isLegacyRoomCoverImage(image)
      ) {
        return normalizeLegacyEntityId(image.OwnerId);
      }
    }
  }

  const room = image.Room;
  if (room == null) return undefined;
  if (typeof room === "object") {
    return normalizeLegacyEntityId(room.Id ?? room.RoomId);
  }
  return normalizeLegacyEntityId(room);
}

const ELONG_GALLERY_SIZE_HINTS = [
  "Hotel350_350",
  "Mobile640_960",
  "Hotel800_600",
  "Hotel375_200",
] as const;

function pickGalleryImageUrl(image: LegacyHotelImage | string): string | undefined {
  const urls = expandLegacyImageUrls(image);
  if (!urls.length) return undefined;
  for (const hint of ELONG_GALLERY_SIZE_HINTS) {
    const match = urls.find((url) => url.includes(hint));
    if (match) return match;
  }
  return urls[0];
}

function collectHotelGalleryImages(hotel: LegacyHotelDetailEntity): LegacyHotelImage[] {
  const raw = hotel.HotelImages ?? hotel.Images ?? [];
  return raw.filter((item): item is LegacyHotelImage => typeof item === "object" && item != null);
}

function dedupeUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const url of urls) {
    if (!url || seen.has(url)) continue;
    seen.add(url);
    result.push(url);
  }
  return result;
}

function expandLegacyImageUrls(image: LegacyHotelImage | string): string[] {
  if (typeof image === "string") {
    const url = resolveLegacyImageUrl({ ImageUrl: image });
    return url ? [url] : [];
  }

  const direct = resolveLegacyImageUrl(image);
  const locations = (image.Locations ?? [])
    .map((item) => resolveLegacyImageUrl({ ImageUrl: item.Url }))
    .filter((url): url is string => Boolean(url));

  if (!locations.length) {
    return direct ? [direct] : [];
  }
  if (direct && !locations.includes(direct)) {
    return [direct, ...locations];
  }
  return locations;
}

function getRoomLookupIds(room: LegacyRoom): string[] {
  const ids = new Set<string>();
  for (const id of [
    normalizeLegacyEntityId(room.Id),
    normalizeLegacyEntityId(room.RoomId),
    normalizeLegacyEntityId((room.VariablesObj ?? parseVariablesObject(room.Variables))?.RoomId),
    normalizeLegacyEntityId((room.VariablesObj ?? parseVariablesObject(room.Variables))?.roomId),
    normalizeLegacyEntityId(
      (room.VariablesObj ?? parseVariablesObject(room.Variables))?.ElongRoomId,
    ),
  ]) {
    if (id) ids.add(id);
  }
  return [...ids];
}

const ELONG_ROOM_THUMB_SIZE = "Hotel70_70";
const ELONG_ROOM_THUMB_SOURCE_SIZES = [
  "Mobile640_960",
  "Hotel350_350",
  "Hotel180_180",
  "Hotel120_120",
  "Hotel375_200",
  "Hotel800_600",
  "Hotel1080_800",
] as const;

/** Legacy room list thumbnails use a smaller CDN variant when available. */
export function toHotelRoomThumbnailUrl(url: string): string {
  for (const size of ELONG_ROOM_THUMB_SOURCE_SIZES) {
    if (url.includes(size)) {
      return url.replace(size, ELONG_ROOM_THUMB_SIZE);
    }
  }
  return url;
}

function buildRoomImageIndex(hotelImages: LegacyHotelImage[] | undefined): Map<string, string[]> {
  const index = new Map<string, string[]>();

  for (const image of hotelImages ?? []) {
    const roomId = getLegacyImageRoomId(image);
    if (!roomId) continue;
    const urls = expandLegacyImageUrls(image);
    const existing = index.get(roomId) ?? [];
    for (const url of urls) {
      if (!existing.includes(url)) existing.push(url);
    }
    index.set(roomId, existing);
  }

  return index;
}

function lookupRoomImageUrls(roomImageIndex: Map<string, string[]>, room: LegacyRoom): string[] {
  for (const roomId of getRoomLookupIds(room)) {
    const urls = roomImageIndex.get(roomId);
    if (urls?.length) return urls;
  }
  return [];
}

function extractRoomImageUrls(roomImageIndex: Map<string, string[]>, room: LegacyRoom): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();

  const push = (value: string | undefined) => {
    if (!value || seen.has(value)) return;
    seen.add(value);
    urls.push(value);
  };

  for (const image of room.Images ?? []) {
    for (const url of expandLegacyImageUrls(image)) {
      push(url);
    }
  }

  for (const url of lookupRoomImageUrls(roomImageIndex, room)) {
    push(url);
  }

  return urls;
}

function mapLegacyRoomPlan(
  plan: LegacyRoomPlan,
  index: number,
): import("@ryx/shared-types").HotelRoomPlan {
  const vars = plan.VariablesObj ?? parseVariablesObject(plan.Variables);
  const uniqueId = getRoomPlanUniqueId(plan);
  const legacyId = plan.Id != null ? String(plan.Id) : undefined;
  const planId = legacyId && legacyId !== "0" ? legacyId : (uniqueId ?? `plan-${index}`);
  return {
    PlanId: planId,
    PlanName: plan.Name ?? "价格计划",
    Price: getPlanAvgPrice(plan) ?? 0,
    Breakfast: getPlanBreakfast(plan),
    CancelPolicy: getPlanCancelPolicy(plan),
    LegacyId: legacyId,
    SupplierType: plan.SupplierType,
    TotalAmount: toPrice(plan.TotalAmount ?? plan.SalesPrice),
    Number: plan.Number,
    SupplierNumber: toLegacySupplierNumber(plan.SupplierNumber),
    BeginDate: plan.BeginDate,
    EndDate: plan.EndDate,
    RoomPlanUniqueId: uniqueId,
    VariablesObj: vars,
  };
}

function mapLegacyRoomDetails(
  room: LegacyRoom,
): import("@ryx/shared-types").HotelRoomDetailItem[] | undefined {
  const details = room.RoomDetails;
  if (!Array.isArray(details) || details.length === 0) return undefined;

  const items = details
    .map((item) => ({
      Label: (item.Name ?? item.Tag ?? "").trim(),
      Value: (item.Description ?? "").trim(),
      Tag: item.Tag,
    }))
    .filter((item) => item.Label.length > 0);

  return items.length > 0 ? items : undefined;
}

function mapLegacyRoom(
  room: LegacyRoom,
  roomIndex: number,
  roomImageIndex: Map<string, string[]>,
  roomDefaultImg?: string,
): import("@ryx/shared-types").HotelRoom {
  const plans = (room.RoomPlans ?? []).map((plan, planIndex) =>
    mapLegacyRoomPlan(plan, roomIndex * 100 + planIndex),
  );
  const roomImageUrls = extractRoomImageUrls(roomImageIndex, room);
  const fallbackUrl = resolveLegacyImageUrl(room);
  const primaryUrl = roomImageUrls[0] ?? fallbackUrl ?? roomDefaultImg;
  const imageCount = roomImageUrls.length > 0 ? roomImageUrls.length : primaryUrl ? 1 : undefined;
  const thumbnailUrl = primaryUrl ? toHotelRoomThumbnailUrl(primaryUrl) : undefined;
  const galleryUrls =
    roomImageUrls.length > 0 ? roomImageUrls : primaryUrl ? [primaryUrl] : undefined;

  return {
    RoomId: room.Id != null ? String(room.Id) : `room-${roomIndex}`,
    RoomName: room.Name ?? "房型",
    ImageUrl: thumbnailUrl,
    ImageUrlFallback:
      thumbnailUrl && primaryUrl && thumbnailUrl !== primaryUrl ? primaryUrl : undefined,
    ImageCount: imageCount != null && imageCount > 0 ? imageCount : undefined,
    ImageUrls: galleryUrls,
    Details: mapLegacyRoomDetails(room),
    Plans: plans,
  };
}

function extractHotelImageUrls(hotel: LegacyHotelDetailEntity): string[] | undefined {
  const images = collectHotelGalleryImages(hotel);
  const urls = dedupeUrls(
    images.map(pickGalleryImageUrl).filter((url): url is string => Boolean(url)),
  );
  if (urls.length) return urls;

  const fallback = resolveLegacyImageUrl(hotel);
  return fallback ? [fallback] : undefined;
}

export function buildHotelDetailRequest(params: HotelDetailParams): Record<string, unknown> {
  const data: Record<string, unknown> = {
    HotelId: params.HotelId,
    CityCode: params.CityCode,
    BeginDate: params.CheckInDate,
    EndDate: params.CheckOutDate,
    IsLoadDetail: true,
    hotelType: params.HotelType ?? "Normal",
    travelformid: params.TravelFormId ?? "",
  };
  if (params.MinPrice != null && !Number.isNaN(params.MinPrice)) {
    data.MinPrice = String(params.MinPrice);
  }
  const cityName = params.CityName?.trim();
  if (cityName) {
    data.CityName = cityName;
  }
  return data;
}

export function normalizeHotelDetailResponse(
  res: unknown,
  params?: HotelDetailParams,
): HotelDetailResponse {
  if (!res || typeof res !== "object") {
    return {
      HotelId: params?.HotelId ?? "",
      HotelName: "",
      CheckInDate: params?.CheckInDate,
      CheckOutDate: params?.CheckOutDate,
      CityCode: params?.CityCode,
    };
  }

  const payload = normalizeEntityKeys(res) as Record<string, unknown>;
  if (Array.isArray(payload.Rooms) && typeof payload.HotelName === "string") {
    const shaped = payload as unknown as HotelDetailResponse;
    const nestedHotel = payload.Hotel as LegacyHotelDetailEntity | undefined;
    if (!nestedHotel) return shaped;
    const info = resolveHotelInfoFields(nestedHotel);
    return {
      ...shaped,
      CheckInOutTime: shaped.CheckInOutTime ?? info.CheckInOutTime,
      BookingNotice: shaped.BookingNotice ?? info.BookingNotice,
      OpeningDate: shaped.OpeningDate ?? info.OpeningDate,
      RenovationDate: shaped.RenovationDate ?? info.RenovationDate,
      Introduction: shaped.Introduction ?? info.Introduction,
    };
  }

  const hotel = (payload.Hotel ?? payload) as LegacyHotelDetailEntity;
  const lat = hotel.Lat != null ? Number(hotel.Lat) : undefined;
  const lng = hotel.Lng != null ? Number(hotel.Lng) : undefined;
  const roomDefaultImg = resolveRoomDefaultImg(payload);
  const roomImageIndex = buildRoomImageIndex(collectHotelGalleryImages(hotel));

  const hotelInfo = resolveHotelInfoFields(hotel);

  return {
    HotelId: hotel.Id ?? params?.HotelId ?? "",
    HotelName: hotel.Name ?? "",
    Address: hotel.Address,
    Star: parseHotelStar(hotel.Category),
    Phone: hotel.Phone,
    Lat: Number.isFinite(lat) ? lat : undefined,
    Lng: Number.isFinite(lng) ? lng : undefined,
    ImageUrls: extractHotelImageUrls(hotel),
    Rooms: (hotel.Rooms ?? []).map((room, index) =>
      mapLegacyRoom(room, index, roomImageIndex, roomDefaultImg),
    ),
    RoomDefaultImg: roomDefaultImg,
    CheckInOutTime: hotelInfo.CheckInOutTime,
    BookingNotice: hotelInfo.BookingNotice,
    OpeningDate: hotelInfo.OpeningDate,
    RenovationDate: hotelInfo.RenovationDate,
    Introduction: hotelInfo.Introduction,
    CheckInDate: params?.CheckInDate,
    CheckOutDate: params?.CheckOutDate,
    CityCode: params?.CityCode,
  };
}

export function normalizeHotelPolicyResponse(res: unknown): HotelPolicyResponse {
  if (Array.isArray(res)) {
    return res as HotelPolicyResponse;
  }
  if (res && typeof res === "object") {
    const payload = res as Record<string, unknown>;
    if (Array.isArray(payload.Policies)) {
      return payload.Policies as HotelPolicyResponse;
    }
  }
  return [];
}

function buildHotelListRequest(params: HotelListParams): Record<string, unknown> {
  const data: Record<string, unknown> = {
    CityCode: params.CityCode,
    BeginDate: params.CheckInDate,
    EndDate: params.CheckOutDate,
    PageIndex: params.PageIndex ?? 0,
    PageSize: params.PageSize ?? 10,
    IsLoadDetail: true,
    hotelType: params.HotelType ?? "Normal",
    Stars: null,
    Passengers: "",
  };
  const cityName = params.CityName?.trim();
  if (cityName) {
    data.CityName = cityName;
  }
  const keyword = params.Keyword?.trim();
  if (keyword) {
    data.SearchKey = keyword;
  }
  return data;
}

function normalizeHotelCities(
  res: HotelCity[] | HotelCityResourceResponse | null | undefined,
): HotelCity[] {
  const raw = Array.isArray(res)
    ? res
    : (res?.Trafficlines ?? res?.TrafficLines ?? res?.HotelCities ?? []);

  return raw
    .map((item) => {
      const line = item as HotelCityLine;
      const name = line.Name ?? line.Nickname ?? line.CityName ?? "";
      return {
        Code: line.Code,
        Name: name,
        Nickname: line.Nickname,
        Pinyin: line.Pinyin,
        Initial: line.Initial,
        FirstLetter: line.FirstLetter,
        IsHot: line.IsHot,
        Sequence: line.Sequence,
      } satisfies HotelCity;
    })
    .filter((city) => Boolean(city.Code && city.Name));
}

export function createHotelApi(proxy: ProxyClient): HotelApi {
  return {
    async getCities() {
      const res = await proxy.send<HotelCity[] | HotelCityResourceResponse>({
        method: TMC_METHODS.RESOURCE_DOMESTICHOTELCITY,
        data: {},
      });
      return normalizeHotelCities(res);
    },
    async getList(params) {
      const res = await proxy.send<unknown>({
        method: HOTEL_FLOW_METHODS.LIST,
        data: buildHotelListRequest(params),
      });
      return normalizeHotelListResponse(res);
    },
    async getDetail(params) {
      const res = await proxy.send<unknown>({
        method: HOTEL_FLOW_METHODS.DETAIL,
        data: buildHotelDetailRequest(params),
      });
      return normalizeHotelDetailResponse(res, params);
    },
    async getPolicy(params) {
      const res = await proxy.send<unknown>({
        method: HOTEL_FLOW_METHODS.POLICY,
        data: params,
      });
      return normalizeHotelPolicyResponse(res);
    },
    initBook(params) {
      return proxy.send<HotelInitBookResponse>({
        method: HOTEL_FLOW_METHODS.INIT,
        data: params,
        timeoutMs: 60_000,
      });
    },
    submitBook(params) {
      return proxy.send<HotelBookResponse>({
        method: HOTEL_FLOW_METHODS.BOOK,
        data: params,
        timeoutMs: 60_000,
      });
    },
  };
}
