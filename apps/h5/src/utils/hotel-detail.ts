import type { HotelDetailParams, HotelRoom, HotelRoomPlan } from "@ryx/shared-types";

import { isRoomFullyBooked } from "@/lib/hotel-book-policy";

export interface HotelDetailQuery {
  checkIn: string;
  checkOut: string;
  cityCode: string;
  cityName: string;
  minPrice?: number;
  hotelType?: HotelDetailParams["HotelType"];
  travelFormId?: string;
  channel?: HotelDetailParams["channel"];
}

export function parseHotelDetailQuery(searchParams: URLSearchParams): HotelDetailQuery {
  const minPriceRaw = searchParams.get("minPrice");
  const minPrice =
    minPriceRaw != null && minPriceRaw !== "" ? Number.parseFloat(minPriceRaw) : undefined;

  return {
    checkIn: searchParams.get("checkIn") ?? "",
    checkOut: searchParams.get("checkOut") ?? "",
    cityCode: searchParams.get("cityCode") ?? "",
    cityName: searchParams.get("cityName") ?? "",
    minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
    hotelType: (searchParams.get("hotelType") as HotelDetailParams["HotelType"]) ?? undefined,
    travelFormId: searchParams.get("travelFormId") ?? searchParams.get("travelformid") ?? undefined,
    channel: (searchParams.get("channel") as HotelDetailParams["channel"]) ?? undefined,
  };
}

export function buildHotelDetailUrl(hotelId: string, query: HotelDetailQuery): string {
  const params = new URLSearchParams({
    checkIn: query.checkIn,
    checkOut: query.checkOut,
    cityCode: query.cityCode,
  });
  if (query.cityName) params.set("cityName", query.cityName);
  if (query.minPrice != null && !Number.isNaN(query.minPrice)) {
    params.set("minPrice", String(query.minPrice));
  }
  if (query.hotelType) params.set("hotelType", query.hotelType);
  if (query.travelFormId) params.set("travelFormId", query.travelFormId);
  if (query.channel) params.set("channel", query.channel);
  return `/hotel/${encodeURIComponent(hotelId)}?${params.toString()}`;
}

export function buildHotelRoomDetailUrl(
  hotelId: string,
  roomId: string,
  query: HotelDetailQuery,
): string {
  const params = new URLSearchParams({
    checkIn: query.checkIn,
    checkOut: query.checkOut,
    cityCode: query.cityCode,
  });
  if (query.cityName) params.set("cityName", query.cityName);
  if (query.minPrice != null && !Number.isNaN(query.minPrice)) {
    params.set("minPrice", String(query.minPrice));
  }
  if (query.hotelType) params.set("hotelType", query.hotelType);
  if (query.travelFormId) params.set("travelFormId", query.travelFormId);
  if (query.channel) params.set("channel", query.channel);
  return `/hotel/${encodeURIComponent(hotelId)}/room/${encodeURIComponent(roomId)}?${params.toString()}`;
}

export function buildHotelDetailParams(
  hotelId: string,
  query: HotelDetailQuery,
): HotelDetailParams | null {
  if (!hotelId || !query.checkIn || !query.checkOut || !query.cityCode) return null;
  return {
    HotelId: hotelId,
    CheckInDate: query.checkIn,
    CheckOutDate: query.checkOut,
    CityCode: query.cityCode,
    CityName: query.cityName || undefined,
    MinPrice: query.minPrice,
    HotelType: query.hotelType,
    TravelFormId: query.travelFormId,
    channel: query.channel,
  };
}

export function getRoomLowestPrice(room: HotelRoom): number | undefined {
  const prices = room.Plans.map((plan: HotelRoomPlan) => plan.Price).filter((value: number) =>
    Number.isFinite(value),
  );
  if (!prices.length) return undefined;
  return Math.min(...prices);
}

export { isRoomFullyBooked };

export function getRoomGalleryUrls(room: HotelRoom, roomDefaultImg?: string): string[] {
  if (room.ImageUrls?.length) return room.ImageUrls;
  const fallback = room.ImageUrlFallback ?? room.ImageUrl ?? roomDefaultImg;
  return fallback ? [fallback] : [];
}

export function getRoomDetailSpecItems(room: HotelRoom): Array<{ label: string; value: string }> {
  if (room.Details?.length) {
    return room.Details.map((item) => ({
      label: item.Label,
      value: item.Value,
    }));
  }
  if (room.Specs) {
    return [{ label: "房型说明", value: room.Specs }];
  }
  return [];
}

export function buildHotelShowImagesUrl(
  hotelId: string,
  hotelName: string,
  initPos: number,
): string {
  const params = new URLSearchParams({
    hotelName,
    initPos: String(Math.max(0, initPos)),
  });
  return `/hotel/${encodeURIComponent(hotelId)}/images?${params.toString()}`;
}

export function buildHotelMapUrl(name: string, lat?: number, lng?: number): string | undefined {
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return undefined;
  }
  return `https://uri.amap.com/marker?position=${lng},${lat}&name=${encodeURIComponent(name)}`;
}
