import type { FlightCabinTab } from "@ryx/shared-types";

interface FlightCabinsTabsProps {
  activeTab: FlightCabinTab;
  onChange: (tab: FlightCabinTab) => void;
}

export function FlightCabinsTabs({ activeTab, onChange }: FlightCabinsTabsProps) {
  return (
    <div className="mx-3 mt-3 grid grid-cols-2 overflow-hidden rounded-lg bg-white p-1 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <button
        type="button"
        className={`rounded-md py-2 text-[13px] font-medium transition ${
          activeTab === "economy"
            ? "bg-[#5099fe] text-white shadow-sm"
            : "text-[#666666]"
        }`}
        onClick={() => onChange("economy")}
      >
        经济/超经
      </button>
      <button
        type="button"
        className={`rounded-md py-2 text-[13px] font-medium transition ${
          activeTab === "business"
            ? "bg-[#5099fe] text-white shadow-sm"
            : "text-[#666666]"
        }`}
        onClick={() => onChange("business")}
      >
        商务/头等
      </button>
    </div>
  );
}
