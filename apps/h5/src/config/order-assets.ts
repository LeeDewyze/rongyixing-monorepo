import { OrderListTabId } from "@ryx/shared-types";

import orderEmptyIllustration from "@/assets/order/empty.png";

export const ORDER_ASSETS = {
  empty: orderEmptyIllustration,
} as const;

export const ORDER_CATEGORY_TABS = [
  { id: "flight" as const, tabId: OrderListTabId.Flight, label: "机票" },
  { id: "train" as const, tabId: OrderListTabId.Train, label: "火车票" },
  { id: "hotel" as const, tabId: OrderListTabId.Hotel, label: "酒店" },
  { id: "car" as const, tabId: OrderListTabId.Car, label: "用车" },
] as const;

export type OrderCategoryId = (typeof ORDER_CATEGORY_TABS)[number]["id"];

export const ORDER_FONT =
  "[font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]";

/** Figma order list header gradient. */
export const ORDER_HEADER_GRADIENT = "linear-gradient(180deg, #7AB1FF 0%, #F5F6F9 99.64%)";

/** Scope tabs track (全部 / 待出行), 20% opacity per Figma. */
export const ORDER_SCOPE_TABS_TRACK =
  "linear-gradient(98.64deg, rgba(39, 104, 250, 0.2) 12.63%, rgba(51, 161, 249, 0.2) 82.81%)";

/** Inner card body gradient (matches HomeRecentTripPanel). */
export const ORDER_CARD_BODY_GRADIENT =
  "linear-gradient(277.92deg, rgba(51, 161, 249, 0) 0%, rgba(39, 104, 250, 0.2) 87.2%)";

/** Bottom tab bar height used by TabLayout (h-14 + safe area). */
export const ORDER_TAB_BAR_INSET_CSS = "calc(3.5rem + env(safe-area-inset-bottom))";
