import { getOrderStatusStyle, getTicketStatusStyle } from "@/lib/order-status";
import { ORDER_FONT } from "@/config/order-assets";

interface OrderStatusBadgeProps {
  label: string;
  variant: "order" | "ticket";
}

export function OrderStatusBadge({ label, variant }: OrderStatusBadgeProps) {
  const style = variant === "order" ? getOrderStatusStyle(label) : getTicketStatusStyle(label);

  return (
    <span
      className={`shrink-0 text-[14px] font-normal leading-none ${ORDER_FONT}`}
      style={{ color: style.color }}
    >
      {label}
    </span>
  );
}
