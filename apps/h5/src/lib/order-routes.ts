import {
  OrderListTabId,
  type OrderListItem,
  type OrderListScope,
  type ProductChannel,
} from "@ryx/shared-types";

import type { OrderCategoryId } from "@/config/order-assets";
import { TAB_ID_TO_PARAM } from "@/lib/order-list-params";

export function getOrderDetailPath(item: OrderListItem): string {
  switch (item.tabId) {
    case OrderListTabId.Flight:
      return `/orders/flight/${item.OrderId}`;
    case OrderListTabId.Hotel:
      return `/orders/hotel/${item.OrderId}`;
    case OrderListTabId.Train:
      return `/orders/train/${item.OrderId}`;
    case OrderListTabId.Car:
      return `/orders/car/${item.OrderId}`;
    default: {
      const _exhaustive: never = item;
      return _exhaustive;
    }
  }
}

export function getOrderPayPath(item: OrderListItem): string {
  switch (item.tabId) {
    case OrderListTabId.Flight:
      return `/flight/pay/${item.OrderId}`;
    case OrderListTabId.Train:
      return `/train/pay/${item.OrderId}`;
    case OrderListTabId.Hotel:
      return `/hotel/pay/${item.OrderId}`;
    default:
      return `/hotel/pay/${item.OrderId}`;
  }
}

export function getOrderListPath(
  categoryId: OrderCategoryId,
  options: { channel?: ProductChannel; scope?: OrderListScope } = {},
): string {
  const params = new URLSearchParams();
  if (options.channel) {
    params.set("channel", options.channel);
  }
  params.set("tab", TAB_ID_TO_PARAM[categoryId]);
  if (options.scope) {
    params.set("scope", options.scope);
  }
  return `/home/orders?${params.toString()}`;
}

export function getOrderResultPath(productType: "Flight" | "Hotel", orderId: string): string {
  return productType === "Flight" ? `/flight/result/${orderId}` : `/hotel/result/${orderId}`;
}
