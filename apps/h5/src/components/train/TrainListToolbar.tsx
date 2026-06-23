import type { ReactNode } from "react";
import type { TrainDurationSortMode, TrainPriceSortMode, TrainSortTab } from "@ryx/shared-types";

import durationIcon from "@/assets/train/toolbar-duration.png";
import filterIcon from "@/assets/train/toolbar-filter.png";
import priceIcon from "@/assets/train/toolbar-price.png";
import timeIcon from "@/assets/train/toolbar-time.png";

interface TrainListToolbarProps {
  activeTab: TrainSortTab;
  filtered: boolean;
  durationSortMode: TrainDurationSortMode;
  timeEarlyToLate: boolean;
  priceSortMode: TrainPriceSortMode;
  onFilter: () => void;
  onDurationSort: () => void;
  onTimeSort: () => void;
  onPriceSort: () => void;
}

function getTimeToolbarHint(activeTab: TrainSortTab, timeEarlyToLate: boolean): string {
  if (activeTab === "time" && !timeEarlyToLate) return "发时最晚";
  return "发时最早";
}

function getPriceToolbarHint(activeTab: TrainSortTab, priceSortMode: TrainPriceSortMode): string {
  if (activeTab === "price" && priceSortMode === "high") return "价格最高";
  return "价格最低";
}

function getDurationToolbarHint(
  activeTab: TrainSortTab,
  durationSortMode: TrainDurationSortMode,
): string {
  if (activeTab === "duration" && durationSortMode === "long") return "耗时最长";
  return "耗时最短";
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

export function TrainListToolbar({
  activeTab,
  filtered,
  durationSortMode,
  timeEarlyToLate,
  priceSortMode,
  onFilter,
  onDurationSort,
  onTimeSort,
  onPriceSort,
}: TrainListToolbarProps) {
  const durationActive = activeTab === "duration" && durationSortMode !== "off";
  const durationHint = getDurationToolbarHint(activeTab, durationSortMode);
  const timeActive = activeTab === "time";
  const timeHint = getTimeToolbarHint(activeTab, timeEarlyToLate);
  const priceActive = activeTab === "price" && priceSortMode !== "off";
  const priceHint = getPriceToolbarHint(activeTab, priceSortMode);
  const filterActive = filtered;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#eeeeee] bg-white pb-[max(0.25rem,env(safe-area-inset-bottom))] shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
      <div className="mx-auto grid max-w-lg grid-cols-4">
        <ToolbarItem
          active={filterActive}
          hint={filtered ? "已筛选" : "筛选"}
          icon={<ToolbarIcon src={filterIcon} active={filterActive} />}
          onClick={onFilter}
        />
        <ToolbarItem
          active={durationActive}
          hint={durationHint}
          icon={<ToolbarIcon src={durationIcon} active={durationActive} />}
          onClick={onDurationSort}
        />
        <ToolbarItem
          active={timeActive}
          hint={timeHint}
          icon={<ToolbarIcon src={timeIcon} active={timeActive} />}
          onClick={onTimeSort}
        />
        <ToolbarItem
          active={priceActive}
          hint={priceHint}
          icon={<ToolbarIcon src={priceIcon} active={priceActive} />}
          onClick={onPriceSort}
        />
      </div>
    </div>
  );
}
