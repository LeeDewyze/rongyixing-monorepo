import type { ReactNode } from "react";
import type { FlightSortTab } from "@ryx/shared-types";

import filterIcon from "@/assets/train/toolbar-filter.png";
import priceIcon from "@/assets/train/toolbar-price.png";
import timeIcon from "@/assets/train/toolbar-time.png";

interface FlightListToolbarProps {
  activeTab: FlightSortTab;
  filtered: boolean;
  priceLowToHigh: boolean;
  timeEarlyToLate: boolean;
  onFilter: () => void;
  onTimeSort: () => void;
  onPriceSort: () => void;
}

function getTimeToolbarHint(activeTab: FlightSortTab, timeEarlyToLate: boolean): string {
  if (activeTab !== "time") return "时间";
  return timeEarlyToLate ? "从早到晚" : "从晚到早";
}

function getPriceToolbarHint(activeTab: FlightSortTab, priceLowToHigh: boolean): string {
  if (activeTab !== "price") return "价格";
  return priceLowToHigh ? "从低到高" : "从高到低";
}

const TOOLBAR_ICON_ACTIVE_FILTER =
  " [filter:invert(48%)_sepia(79%)_saturate(2476%)_hue-rotate(196deg)_brightness(101%)_contrast(101%)]";

function ToolbarIcon({ src, active }: { src: string; active: boolean }) {
  return (
    <img
      src={src}
      alt=""
      width={20}
      height={20}
      className={`size-5 object-contain${active ? TOOLBAR_ICON_ACTIVE_FILTER : ""}`}
      aria-hidden
    />
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
  icon: ReactNode;
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
      {icon}
      {hint}
    </button>
  );
}

export function FlightListToolbar({
  activeTab,
  filtered,
  priceLowToHigh,
  timeEarlyToLate,
  onFilter,
  onTimeSort,
  onPriceSort,
}: FlightListToolbarProps) {
  const filterActive = filtered;
  const timeActive = activeTab === "time";
  const priceActive = activeTab === "price";

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#eeeeee] bg-white pb-[max(0.25rem,env(safe-area-inset-bottom))] shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
      <div className="mx-auto grid max-w-lg grid-cols-3">
        <ToolbarItem
          active={filterActive}
          hint={filtered ? "已筛选" : "筛选"}
          icon={<ToolbarIcon src={filterIcon} active={filterActive} />}
          onClick={onFilter}
        />
        <ToolbarItem
          active={timeActive}
          hint={getTimeToolbarHint(activeTab, timeEarlyToLate)}
          icon={<ToolbarIcon src={timeIcon} active={timeActive} />}
          onClick={onTimeSort}
        />
        <ToolbarItem
          active={priceActive}
          hint={getPriceToolbarHint(activeTab, priceLowToHigh)}
          icon={<ToolbarIcon src={priceIcon} active={priceActive} />}
          onClick={onPriceSort}
        />
      </div>
    </div>
  );
}
