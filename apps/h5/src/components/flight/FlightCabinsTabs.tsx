import type { FlightCabinTab } from "@ryx/shared-types";

import { FLIGHT_CABINS_FONT } from "@/components/flight/flight-cabins-chrome";

interface FlightCabinsTabsProps {
  activeTab: FlightCabinTab;
  onChange: (tab: FlightCabinTab) => void;
}

const TABS: { id: FlightCabinTab; label: string }[] = [
  { id: "economy", label: "经济/超经" },
  { id: "business", label: "商务/头等" },
];

export function FlightCabinsTabs({ activeTab, onChange }: FlightCabinsTabsProps) {
  return (
    <div
      className={`flex h-10 rounded-lg bg-[#EEF4FC] p-1 ${FLIGHT_CABINS_FONT}`}
      role="tablist"
      aria-label="舱位类型"
    >
      {TABS.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={`flex flex-1 items-center justify-center rounded-md text-[14px] leading-none transition ${
              active
                ? "bg-white font-medium text-brand-title shadow-[0_1px_4px_rgba(39,104,250,0.12)]"
                : "font-normal text-[#666666] active:bg-white/50"
            }`}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
