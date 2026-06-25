import type { OrderAction } from "@ryx/shared-types";

import { ORDER_FONT } from "@/config/order-assets";

interface OrderActionBarProps {
  actions: OrderAction[];
  onAction?: (action: OrderAction) => void;
}

export function OrderActionBar({ actions, onAction }: OrderActionBarProps) {
  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="ml-auto flex shrink-0 items-center gap-2">
      {actions.map((action) => {
        const isPrimary = action.kind === "pay" || action.kind === "exchange";
        return (
          <button
            key={action.kind}
            type="button"
            className={`min-w-[64px] rounded-full px-4 py-1.5 text-[14px] leading-none ${ORDER_FONT} ${
              isPrimary
                ? "border border-transparent bg-[#2768FA] font-medium text-white"
                : "border border-[#2768FA] bg-white font-normal text-[#2768FA]"
            }`}
            onClick={(event) => {
              event.stopPropagation();
              onAction?.(action);
            }}
          >
            {action.label}
          </button>
        );
      })}
    </div>
  );
}
