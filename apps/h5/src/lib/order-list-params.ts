import { OrderListTabId, type OrderListScope, type ProductChannel } from "@ryx/shared-types";

import type { HomeTravelMode } from "@/config/home-assets";
import { resolveProductChannel } from "@/lib/flight-travel-mode";
import {
  ORDER_CATEGORY_TABS,
  ORDER_TYPE_TABS,
  type OrderCategoryId,
  type OrderTypeTab,
} from "@/config/order-assets";

const TAB_PARAM_TO_ID: Record<string, OrderCategoryId> = {
  flight: "flight",
  train: "train",
  hotel: "hotel",
};

export const TAB_ID_TO_PARAM: Record<OrderCategoryId, string> = {
  flight: "flight",
  train: "train",
  hotel: "hotel",
};

const TAB_ID_TO_CATEGORY: Partial<Record<OrderListTabId, OrderCategoryId>> = {
  [OrderListTabId.Flight]: "flight",
  [OrderListTabId.Train]: "train",
  [OrderListTabId.Hotel]: "hotel",
};

export const CATEGORY_TO_TAB_ID: Record<OrderCategoryId, OrderListTabId> = {
  flight: OrderListTabId.Flight,
  train: OrderListTabId.Train,
  hotel: OrderListTabId.Hotel,
};

function parseCategoryFromTabParam(value: string | null): OrderCategoryId | undefined {
  if (value && value in TAB_PARAM_TO_ID) {
    return TAB_PARAM_TO_ID[value];
  }
  return undefined;
}

function parseCategoryFromTabIdParam(value: string | null): OrderCategoryId | undefined {
  if (!value) {
    return undefined;
  }
  const tabId = Number(value);
  if (!Number.isInteger(tabId)) {
    return undefined;
  }
  return TAB_ID_TO_CATEGORY[tabId as OrderListTabId];
}

export const DEFAULT_ORDER_CATEGORY: OrderCategoryId = "flight";
export const DEFAULT_ORDER_CHANNEL: ProductChannel = "tmc";

export function parseOrderListCategoryId(searchParams: URLSearchParams): OrderCategoryId {
  return (
    parseCategoryFromTabParam(searchParams.get("tab")) ??
    parseCategoryFromTabIdParam(searchParams.get("tabId")) ??
    DEFAULT_ORDER_CATEGORY
  );
}

export function parseOrderListChannel(
  searchParams: URLSearchParams,
  fallbackMode?: HomeTravelMode,
): ProductChannel {
  const raw = searchParams.get("channel");
  if (raw === "tourist" || raw === "tmc") {
    return raw;
  }
  return fallbackMode ? resolveProductChannel(fallbackMode) : DEFAULT_ORDER_CHANNEL;
}

export function parseOrderListScope(value: string | null): OrderListScope {
  return value === "pendingTravel" ? "pendingTravel" : "all";
}

export interface OrderListRouteState {
  channel: ProductChannel;
  categoryId: OrderCategoryId;
  scope: OrderListScope;
}

export function parseOrderListRouteState(
  searchParams: URLSearchParams,
  fallbackMode?: HomeTravelMode,
): OrderListRouteState {
  return {
    channel: parseOrderListChannel(searchParams, fallbackMode),
    categoryId: parseOrderListCategoryId(searchParams),
    scope: parseOrderListScope(searchParams.get("scope")),
  };
}

export function buildOrderListSearchParams(
  current: URLSearchParams,
  next: Partial<OrderListRouteState>,
): URLSearchParams {
  const params = new URLSearchParams(current);
  const categoryId = next.categoryId ?? parseOrderListCategoryId(params);
  const channel = next.channel ?? parseOrderListChannel(params);
  const scope = next.scope ?? parseOrderListScope(params.get("scope"));

  params.delete("tabId");
  params.set("channel", channel);
  params.set("tab", TAB_ID_TO_PARAM[categoryId]);
  params.set("scope", scope);
  return params;
}

export function resolveOrderTypeTab(
  channel: ProductChannel,
  categoryId: OrderCategoryId,
): OrderTypeTab {
  return (
    ORDER_TYPE_TABS.find((tab) => tab.channel === channel && tab.categoryId === categoryId) ??
    ORDER_TYPE_TABS[0]
  );
}

/** Maps category id to label for tests or deep links. */
export function getOrderCategoryLabel(id: OrderCategoryId): string {
  return ORDER_CATEGORY_TABS.find((t) => t.id === id)?.label ?? "";
}
