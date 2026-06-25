import type { HotelRoom, HotelRoomPlan } from "@ryx/shared-types";

import { buildHotelDetailUrl } from "@/utils/hotel-detail";

const STORAGE_KEY = "ryx_hotel_book_selection";
export const HOTEL_BOOK_SELECTION_EVENT = "ryx-hotel-book-selection-change";

export interface HotelBookSelection {
  hotelId: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  cityCode: string;
  cityName?: string;
  room: HotelRoom;
  plan: HotelRoomPlan;
  policyRules?: string[];
  checkInOutTime?: string;
  bookingNotice?: string;
  hotelAddress?: string;
  hotelPhone?: string;
  selectedAt: number;
}

function notifyChange(): void {
  window.dispatchEvent(new CustomEvent(HOTEL_BOOK_SELECTION_EVENT));
}

export function loadHotelBookSelection(): HotelBookSelection | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as HotelBookSelection;
    if (!parsed?.hotelId || !parsed?.room || !parsed?.plan) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveHotelBookSelection(selection: HotelBookSelection): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
  notifyChange();
}

export function clearHotelBookSelection(): void {
  sessionStorage.removeItem(STORAGE_KEY);
  notifyChange();
}

export function buildHotelBookDetailUrl(selection: HotelBookSelection): string | null {
  if (!selection.cityCode) return null;
  return buildHotelDetailUrl(selection.hotelId, {
    checkIn: selection.checkIn,
    checkOut: selection.checkOut,
    cityCode: selection.cityCode,
    cityName: selection.cityName ?? "",
  });
}
