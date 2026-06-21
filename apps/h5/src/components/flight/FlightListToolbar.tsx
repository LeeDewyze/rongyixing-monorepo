import type { FlightSortTab } from "@ryx/shared-types";

import filterIcon from "@/assets/flight/toolbar-filter.png";
import priceIcon from "@/assets/flight/toolbar-price.png";
import timeIcon from "@/assets/flight/toolbar-time.png";

interface FlightListToolbarProps {
  activeTab: FlightSortTab;
  filtered: boolean;
  priceLowToHigh: boolean;
  timeEarlyToLate: boolean;
  onFilter: () => void;
  onOpenTimeSort: () => void;
  onOpenPriceSort: () => void;
}

export function FlightListToolbar({
  activeTab,
  filtered,
  priceLowToHigh,
  timeEarlyToLate,
  onFilter,
  onOpenTimeSort,
  onOpenPriceSort,
}: FlightListToolbarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#eeeeee] bg-white pb-[max(0.25rem,env(safe-area-inset-bottom))] shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
      <div className="mx-auto grid max-w-lg grid-cols-3">
        <ToolbarItem
          active={activeTab === "filter"}
          hint={filtered ? "已筛选" : "筛选"}
          icon={filterIcon}
          onClick={onFilter}
        />
        <ToolbarItem
          active={activeTab === "time"}
          hint={
            activeTab === "time"
              ? timeEarlyToLate
                ? "从早到晚"
                : "从晚到早"
              : "时间"
          }
          icon={timeIcon}
          onClick={onOpenTimeSort}
        />
        <ToolbarItem
          active={activeTab === "price"}
          hint={
            activeTab === "price"
              ? priceLowToHigh
                ? "从低到高"
                : "从高到低"
              : "价格"
          }
          icon={priceIcon}
          onClick={onOpenPriceSort}
        />
      </div>
    </div>
  );
}

function ToolbarItem({
  active,
  hint,
  icon,
  onClick,
}: {
  active: boolean;
  hint: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 py-2.5 text-[11px] ${
        active ? "text-[#5099fe]" : "text-[#666666]"
      }`}
    >
      <img
        src={icon}
        alt=""
        className={`size-5${
          active
            ? " [filter:invert(48%)_sepia(79%)_saturate(2476%)_hue-rotate(196deg)_brightness(101%)_contrast(101%)]"
            : ""
        }`}
        aria-hidden
      />
      {hint}
    </button>
  );
}
