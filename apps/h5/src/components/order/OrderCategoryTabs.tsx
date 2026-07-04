import { useEffect, useRef, useState } from "react";

import type { OrderListScope } from "@ryx/shared-types";

import {
  ORDER_CATEGORY_TABS,
  ORDER_TYPE_TABS,
  ORDER_FONT,
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

interface OrderChannelTabsProps extends OrderCategoryTabsProps {
  /** Smaller pill for the page title row. */
  compact?: boolean;
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
      <div className="order-product-tabs" role="tablist" aria-label="Order product">
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

export function OrderChannelTabs({ activeId, onChange, compact = false }: OrderChannelTabsProps) {
  const activeTab = ORDER_TYPE_TABS.find((tab) => tab.id === activeId) ?? ORDER_TYPE_TABS[0];
  const activeChannel = activeTab.channel;

  return (
    <div
      className={`order-channel-tabs order-channel-tabs--${activeChannel}${
        compact ? " order-channel-tabs--compact" : ""
      } ${ORDER_FONT}`}
    >
      <div className="order-channel-tabs__inner" role="tablist" aria-label="Order ownership">
        {[
          { channel: "tmc" as const, label: "因公" },
          { channel: "tourist" as const, label: "因私" },
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

interface OrderChannelDropdownProps extends OrderCategoryTabsProps {
  /** Inline nav-title style for the embedded tab header. */
  embedded?: boolean;
}

function ChannelChevron({ open, embedded = false }: { open: boolean; embedded?: boolean }) {
  return (
    <svg
      className={`order-channel-dropdown__chevron${open ? " is-open" : ""}${
        embedded ? " order-channel-dropdown__chevron--embedded" : ""
      }`}
      width="10"
      height="10"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 4.5 6 7.5 9 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const CHANNEL_OPTIONS = [
  { channel: "tmc" as const, label: "因公" },
  { channel: "tourist" as const, label: "因私" },
];

export function OrderChannelDropdown({
  activeId,
  onChange,
  embedded = false,
}: OrderChannelDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const activeTab = getActiveTab(activeId);
  const activeChannel = activeTab.channel;
  const activeLabel = activeChannel === "tmc" ? "因公" : "因私";

  useEffect(() => {
    if (!open) {
      return;
    }
    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <>
      {open ? (
        <button
          type="button"
          className="order-channel-dropdown__backdrop"
          aria-label="关闭"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <div
        ref={rootRef}
        className={`order-channel-dropdown order-channel-dropdown--${activeChannel}${
          embedded ? " order-channel-dropdown--embedded" : ""
        } ${ORDER_FONT}`}
      >
        <button
          type="button"
          className="order-channel-dropdown__trigger"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {embedded ? (
            <span className="order-channel-dropdown__trigger-inner">
              <span className="order-channel-dropdown__label">{activeLabel}</span>
              <span className="order-channel-dropdown__chevron-wrap" aria-hidden="true">
                <ChannelChevron open={open} embedded={embedded} />
              </span>
            </span>
          ) : (
            <>
              <span className="order-channel-dropdown__label">{activeLabel}</span>
              <span className="order-channel-dropdown__chevron-wrap" aria-hidden="true">
                <ChannelChevron open={open} embedded={embedded} />
              </span>
            </>
          )}
        </button>
        {open ? (
          <div className="order-channel-dropdown__menu" role="listbox" aria-label="Order ownership">
            {CHANNEL_OPTIONS.map((option) => {
              const active = activeChannel === option.channel;
              return (
                <button
                  key={option.channel}
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`order-channel-dropdown__option${active ? " is-active" : ""}`}
                  onClick={() => {
                    onChange(findOrderTab(activeTab, option.channel));
                    setOpen(false);
                  }}
                >
                  <span className="order-channel-dropdown__option-label">{option.label}</span>
                  {active ? (
                    <span className="order-channel-dropdown__check-badge" aria-hidden="true">
                      <svg
                        className="order-channel-dropdown__check"
                        width="14"
                        height="14"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <path
                          d="M3.5 8.5 6.5 11.5 12.5 4.5"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  ) : (
                    <span className="order-channel-dropdown__option-spacer" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </>
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
      className={`order-scope-tabs flex w-full ${ORDER_FONT}`}
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
