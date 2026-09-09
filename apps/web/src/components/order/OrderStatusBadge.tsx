import { getOrderStatusStyle, getTicketStatusStyle } from "@/lib/order-status";
import { ORDER_FONT } from "@/config/order-assets";

interface OrderStatusBadgeProps {
  label: string;
  variant: "order" | "ticket";
  showBookingSpinner?: boolean;
}

export function OrderStatusBadge({ label, variant, showBookingSpinner = false }: OrderStatusBadgeProps) {
  const style = variant === "order" ? getOrderStatusStyle(label) : getTicketStatusStyle(label);
  const isBookingInProgress = showBookingSpinner && /预订中/.test(label);

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 text-[14px] font-medium leading-none ${ORDER_FONT}`}
      style={{ color: style.color }}
    >
      {isBookingInProgress ? (
        <span
          aria-hidden="true"
          className="size-3 shrink-0 animate-spin rounded-full border border-current border-t-transparent"
        />
      ) : null}
      {label}
    </span>
  );
}
