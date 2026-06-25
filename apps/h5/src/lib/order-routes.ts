import { OrderListTabId, type OrderListItem } from "@ryx/shared-types";

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
    case OrderListTabId.Hotel:
      return `/hotel/pay/${item.OrderId}`;
    default:
      return `/hotel/pay/${item.OrderId}`;
  }
}

export function getOrderResultPath(productType: "Flight" | "Hotel", orderId: string): string {
  return productType === "Flight" ? `/flight/result/${orderId}` : `/hotel/result/${orderId}`;
}
