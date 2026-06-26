import type { OrderAction, OrderListItem } from "@ryx/shared-types";

export interface StatusStyle {
  color: string;
}

const ORDER_STATUS_COLORS: Record<string, string> = {
  待付款: "#FF4D4F",
  待支付: "#FF4D4F",
  待出票: "#FF4D4F",
  待出行: "#FF9500",
  交易完成: "#34C759",
  已完成: "#34C759",
  已取消: "#9CA3AF",
  交易取消: "#8E8E93",
};

const GRAY_PRICE_STATUSES = new Set(["Cancelled", "已取消"]);
const GRAY_PRICE_STATUS_NAMES = new Set(["已取消", "交易取消"]);

export function getOrderStatusStyle(statusName: string): StatusStyle {
  return { color: ORDER_STATUS_COLORS[statusName] ?? "#010101" };
}

const TICKET_STATUS_COLORS: Record<string, string> = {
  待出票: "#FF4D4F",
  预订成功: "#FF4D4F",
  预订中: "#FF4D4F",
  出票中: "#FF4D4F",
  已出票: "#52C41A",
  已退票: "#9CA3AF",
  废除: "#9CA3AF",
};

const TICKET_STATUS_FALLBACK_DEFAULT = "#666666";

function resolveTicketStatusColor(statusName: string): string {
  const exact = TICKET_STATUS_COLORS[statusName.trim()];
  if (exact) return exact;
  if (/待出票|待付款|预订|出票中|改签中|取消中/.test(statusName)) return "#FF4D4F";
  if (/已出票|成功|完成/.test(statusName)) return "#52C41A";
  if (/废除|退票|取消|作废/.test(statusName)) return "#9CA3AF";
  return TICKET_STATUS_FALLBACK_DEFAULT;
}

export function getTicketStatusStyle(statusName: string): StatusStyle {
  return { color: resolveTicketStatusColor(statusName) };
}

export function shouldGrayPrice(item: OrderListItem): boolean {
  if (GRAY_PRICE_STATUSES.has(item.Status)) {
    return true;
  }
  return GRAY_PRICE_STATUS_NAMES.has(item.StatusName);
}

/** Hide per-ticket status (e.g. 废除) when the order itself is cancelled. */
export function shouldShowTicketStatus(item: OrderListItem): boolean {
  return !shouldGrayPrice(item);
}

export function getOrderActions(item: OrderListItem): OrderAction[] {
  return item.Actions ?? [];
}
