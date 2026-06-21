import { OrderListTabId, type OrderListScope } from "@ryx/shared-types";

import type { OrderCategoryId } from "@/components/order/OrderCategoryTabs";
import { ORDER_CATEGORY_TABS } from "@/config/order-assets";

const TAB_PARAM_TO_ID: Record<string, OrderCategoryId> = {
  flight: "flight",
  train: "train",
  hotel: "hotel",
  car: "car",
};

export const TAB_ID_TO_PARAM: Record<OrderCategoryId, string> = {
  flight: "flight",
  train: "train",
  hotel: "hotel",
  car: "car",
};

const TAB_ID_TO_CATEGORY: Partial<Record<OrderListTabId, OrderCategoryId>> = {
  [OrderListTabId.Flight]: "flight",
  [OrderListTabId.Train]: "train",
  [OrderListTabId.Hotel]: "hotel",
  [OrderListTabId.Car]: "car",
};

export const CATEGORY_TO_TAB_ID: Record<OrderCategoryId, OrderListTabId> = {
  flight: OrderListTabId.Flight,
  train: OrderListTabId.Train,
  hotel: OrderListTabId.Hotel,
  car: OrderListTabId.Car,
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

export function parseOrderListCategoryId(searchParams: URLSearchParams): OrderCategoryId {
  return (
    parseCategoryFromTabParam(searchParams.get("tab")) ??
    parseCategoryFromTabIdParam(searchParams.get("tabId")) ??
    "hotel"
  );
}

export function parseOrderListScope(value: string | null): OrderListScope {
  return value === "pendingTravel" ? "pendingTravel" : "all";
}

/** Maps category id to label for tests or deep links. */
export function getOrderCategoryLabel(id: OrderCategoryId): string {
  return ORDER_CATEGORY_TABS.find((t) => t.id === id)?.label ?? "";
}
