import type { OrderAction, OrderListItem } from "@ryx/shared-types";

export interface StatusStyle {
  color: string;
}

const ORDER_STATUS_COLORS: Record<string, string> = {
  待付款: "#FF4D4F",
  待支付: "#FF4D4F",
  待出票: "#FF4D4F",
  待出行: "#FF9500",
  交易完成: "#52C41A",
  已完成: "#52C41A",
  已取消: "#9CA3AF",
};

const TICKET_STATUS_COLORS: Record<string, string> = {
  待出票: "#FF4D4F",
  已出票: "#52C41A",
  已退票: "#9CA3AF",
};

const GRAY_PRICE_STATUSES = new Set(["Cancelled", "已取消"]);

export function getOrderStatusStyle(statusName: string): StatusStyle {
  return { color: ORDER_STATUS_COLORS[statusName] ?? "#010101" };
}

export function getTicketStatusStyle(statusName: string): StatusStyle {
  return { color: TICKET_STATUS_COLORS[statusName] ?? "#666666" };
}

export function shouldGrayPrice(item: OrderListItem): boolean {
  if (GRAY_PRICE_STATUSES.has(item.Status)) {
    return true;
  }
  return item.StatusName === "已取消";
}

export function getOrderActions(item: OrderListItem): OrderAction[] {
  return item.Actions ?? [];
}
