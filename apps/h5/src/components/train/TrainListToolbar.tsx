import type { ReactNode } from "react";
import type { TrainSortTab } from "@ryx/shared-types";

import filterIcon from "@/assets/flight/toolbar-filter.png";
import priceIcon from "@/assets/flight/toolbar-price.png";
import timeIcon from "@/assets/flight/toolbar-time.png";

interface TrainListToolbarProps {
  activeTab: TrainSortTab;
  filtered: boolean;
  durationShortToLong: boolean;
  timeEarlyToLate: boolean;
  priceLowToHigh: boolean;
  onFilter: () => void;
  onOpenDurationSort: () => void;
  onOpenTimeSort: () => void;
  onOpenPriceSort: () => void;
}

function DurationIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`size-5 ${active ? "text-[#5099fe]" : "text-[#666666]"}`}
      aria-hidden
    >
      <path
        d="M12 4v8l4 2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
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
  durationShortToLong,
  timeEarlyToLate,
  priceLowToHigh,
  onFilter,
  onOpenDurationSort,
  onOpenTimeSort,
  onOpenPriceSort,
}: TrainListToolbarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#eeeeee] bg-white pb-[max(0.25rem,env(safe-area-inset-bottom))] shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
      <div className="mx-auto grid max-w-lg grid-cols-4">
        <ToolbarItem
          active={activeTab === "filter"}
          hint={filtered ? "已筛选" : "筛选"}
          icon={
            <img
              src={filterIcon}
              alt=""
              className={`size-5${
                activeTab === "filter"
                  ? " [filter:invert(48%)_sepia(79%)_saturate(2476%)_hue-rotate(196deg)_brightness(101%)_contrast(101%)]"
                  : ""
              }`}
              aria-hidden
            />
          }
          onClick={onFilter}
        />
        <ToolbarItem
          active={activeTab === "duration"}
          hint={activeTab === "duration" ? (durationShortToLong ? "从短到长" : "从长到短") : "耗时"}
          icon={<DurationIcon active={activeTab === "duration"} />}
          onClick={onOpenDurationSort}
        />
        <ToolbarItem
          active={activeTab === "time"}
          hint={activeTab === "time" ? (timeEarlyToLate ? "从早到晚" : "从晚到早") : "时间"}
          icon={
            <img
              src={timeIcon}
              alt=""
              className={`size-5${
                activeTab === "time"
                  ? " [filter:invert(48%)_sepia(79%)_saturate(2476%)_hue-rotate(196deg)_brightness(101%)_contrast(101%)]"
                  : ""
              }`}
              aria-hidden
            />
          }
          onClick={onOpenTimeSort}
        />
        <ToolbarItem
          active={activeTab === "price"}
          hint={activeTab === "price" ? (priceLowToHigh ? "从低到高" : "从高到低") : "价格"}
          icon={
            <img
              src={priceIcon}
              alt=""
              className={`size-5${
                activeTab === "price"
                  ? " [filter:invert(48%)_sepia(79%)_saturate(2476%)_hue-rotate(196deg)_brightness(101%)_contrast(101%)]"
                  : ""
              }`}
              aria-hidden
            />
          }
          onClick={onOpenPriceSort}
        />
      </div>
    </div>
  );
}
