import type { OrderListScope } from "@ryx/shared-types";

import { ORDER_CATEGORY_TABS, ORDER_FONT, type OrderCategoryId } from "@/config/order-assets";

import { OrderTabIndicator } from "./OrderTabIndicator";

export type { OrderCategoryId };
export { ORDER_CATEGORY_TABS };

interface OrderCategoryTabsProps {
  activeId: OrderCategoryId;
  onChange: (id: OrderCategoryId) => void;
}

export function OrderCategoryTabs({ activeId, onChange }: OrderCategoryTabsProps) {
  return (
    <div className={`grid grid-cols-4 ${ORDER_FONT}`}>
      {ORDER_CATEGORY_TABS.map((tab) => {
        const active = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            className={`flex flex-col items-center justify-center gap-1 pb-2 pt-3 text-[15px] leading-none transition-colors ${
              active
                ? "rounded-t-xl bg-white font-semibold text-[#010101]"
                : "bg-transparent font-medium text-[#666666]"
            }`}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
            <OrderTabIndicator active={active} />
          </button>
        );
      })}
    </div>
  );
}

interface OrderScopeTabsProps {
  scope: OrderListScope;
  onChange: (scope: OrderListScope) => void;
}

const SCOPE_OPTIONS: { id: OrderListScope; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "pendingTravel", label: "待出行" },
];

export function OrderScopeTabs({ scope, onChange }: OrderScopeTabsProps) {
  return (
    <div
      className={`mx-3 mb-3 flex rounded-full bg-[#D6E8FF]/60 p-1 ${ORDER_FONT}`}
      role="tablist"
      aria-label="Order scope"
    >
      {SCOPE_OPTIONS.map((option) => {
        const active = scope === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={`flex-1 rounded-full py-2 text-center text-[14px] leading-none transition-colors ${
              active
                ? "bg-white font-medium text-[#010101] shadow-sm"
                : "bg-transparent font-normal text-[#666666]"
            }`}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
