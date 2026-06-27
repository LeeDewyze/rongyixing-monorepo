import type { FlightCabinTab } from "@ryx/shared-types";

import "@/components/order/order-category-tabs.css";
import { ORDER_FONT, ORDER_SCOPE_TABS_TRACK } from "@/config/order-assets";

interface FlightCabinsTabsProps {
  activeTab: FlightCabinTab;
  onChange: (tab: FlightCabinTab) => void;
}

const TABS: { id: FlightCabinTab; label: string }[] = [
  { id: "economy", label: "经济/超经" },
  { id: "business", label: "商务/头等" },
];

/** Cabin class tabs — same segmented control as order list scope tabs (全部 / 待出行). */
export function FlightCabinsTabs({ activeTab, onChange }: FlightCabinsTabsProps) {
  return (
    <div
      className={`order-scope-tabs flex h-10 p-1 ${ORDER_FONT}`}
      style={{ background: ORDER_SCOPE_TABS_TRACK }}
      role="tablist"
      aria-label="Cabin class"
    >
      {TABS.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={`order-scope-tab${active ? " order-scope-tab--active" : ""}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
