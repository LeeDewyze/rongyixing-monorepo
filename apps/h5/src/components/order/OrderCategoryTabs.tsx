import type { OrderListScope } from "@ryx/shared-types";

import {
  ORDER_CATEGORY_TABS,
  ORDER_TYPE_TABS,
  ORDER_FONT,
  ORDER_SCOPE_TABS_TRACK,
  type OrderCategoryId,
  type OrderTypeTab,
} from "@/config/order-assets";

import "./order-category-tabs.css";

export type { OrderCategoryId };
export { ORDER_CATEGORY_TABS };

interface OrderCategoryTabsProps {
  activeId: string;
  onChange: (tab: OrderTypeTab) => void;
}

function getActiveTab(activeId: string): OrderTypeTab {
  return ORDER_TYPE_TABS.find((tab) => tab.id === activeId) ?? ORDER_TYPE_TABS[0];
}

function findOrderTab(
  activeTab: OrderTypeTab,
  channel: OrderTypeTab["channel"],
  categoryId = activeTab.categoryId,
): OrderTypeTab {
  return (
    ORDER_TYPE_TABS.find((tab) => tab.channel === channel && tab.categoryId === categoryId) ??
    activeTab
  );
}

export function OrderCategoryTabs({ activeId, onChange }: OrderCategoryTabsProps) {
  const activeTab = getActiveTab(activeId);
  const activeChannel = activeTab.channel;
  const activeCategoryId = activeTab.categoryId;

  return (
    <div className={`order-category-tabs order-category-tabs--${activeChannel} ${ORDER_FONT}`}>
      <div
        className="order-product-tabs"
        role="tablist"
        aria-label="Order product"
      >
        {ORDER_CATEGORY_TABS.map((category) => {
          const active = activeCategoryId === category.id;
          const target = findOrderTab(activeTab, activeChannel, category.id);
          const label = category.id === "train" ? "火车" : category.label;
          return (
            <button
              key={category.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`order-product-tab${active ? " order-product-tab--active" : ""}`}
              onClick={() => onChange(target)}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function OrderChannelTabs({ activeId, onChange }: OrderCategoryTabsProps) {
  const activeTab = ORDER_TYPE_TABS.find((tab) => tab.id === activeId) ?? ORDER_TYPE_TABS[0];
  const activeChannel = activeTab.channel;

  return (
    <div className={`order-channel-tabs order-channel-tabs--${activeChannel} ${ORDER_FONT}`}>
      <div
        className="order-channel-tabs__inner"
        role="tablist"
        aria-label="Order ownership"
      >
        {[
          { channel: "tmc" as const, label: "企业" },
          { channel: "tourist" as const, label: "个人" },
        ].map((option) => {
          const active = activeChannel === option.channel;
          return (
            <button
              key={option.channel}
              type="button"
              role="tab"
              aria-selected={active}
              className={`order-channel-tab order-channel-tab--${option.channel}${
                active ? " order-channel-tab--active" : ""
              }`}
              onClick={() => onChange(findOrderTab(activeTab, option.channel))}
            >
              {option.label}
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
      className={`order-scope-tabs inline-flex p-1 ${ORDER_FONT}`}
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
