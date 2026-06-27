import type { OrderListScope } from "@ryx/shared-types";

import {
  ORDER_CATEGORY_TABS,
  ORDER_FONT,
  ORDER_SCOPE_TABS_TRACK,
  type OrderCategoryId,
} from "@/config/order-assets";

import "./order-category-tabs.css";

export type { OrderCategoryId };
export { ORDER_CATEGORY_TABS };

interface OrderCategoryTabsProps {
  activeId: OrderCategoryId;
  onChange: (id: OrderCategoryId) => void;
}

export function OrderCategoryTabs({ activeId, onChange }: OrderCategoryTabsProps) {
  return (
    <div className={`order-category-tabs ${ORDER_FONT}`}>
      <div
        className="order-category-tabs__list grid grid-cols-4"
        role="tablist"
        aria-label="Order category"
      >
        {ORDER_CATEGORY_TABS.map((tab) => {
          const active = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`order-category-tab${active ? " order-category-tab--active" : ""}`}
              onClick={() => onChange(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
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
      className={`order-scope-tabs flex h-10 w-full p-1 ${ORDER_FONT}`}
      style={{ background: ORDER_SCOPE_TABS_TRACK }}
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
            className={`order-scope-tab${active ? " order-scope-tab--active" : ""}`}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
