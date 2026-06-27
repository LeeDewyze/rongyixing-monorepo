import { HOTEL_DETAIL_FONT, HOTEL_HEADER_GRADIENT } from "@/components/hotel/hotel-detail-chrome";

/** Shared typography for flight cabins chrome. */
export const FLIGHT_CABINS_FONT = HOTEL_DETAIL_FONT;

/** Sky-blue header gradient — aligned with hotel detail / list. */
export const FLIGHT_CABINS_HEADER_GRADIENT = HOTEL_HEADER_GRADIENT;

export const FLIGHT_CABINS_CHROME = {
  title: "#010101",
  action: "#2768FA",
  actionDisabled: "#9CA3AF",
  tabPanel: "#EEF4FC",
  tabTrack: "rgba(255,255,255,0.82)",
  pageBg: "#F5F6F9",
  cardRing: "#ECEEF2",
} as const;
