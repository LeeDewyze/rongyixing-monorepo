import type { ReactNode } from "react";

import filterIcon from "@/assets/train/toolbar-filter.png";
import priceIcon from "@/assets/train/toolbar-price.png";

export type HotelListToolbarId = "recommended" | "priceStar" | "location" | "filter";

interface HotelListToolbarProps {
  activeId?: HotelListToolbarId | null;
  filtered?: boolean;
  onSelect: (id: HotelListToolbarId) => void;
}

function ToolbarImageIcon({ src, active }: { src: string; active: boolean }) {
  return (
    <img
      src={src}
      alt=""
      width={20}
      height={20}
      className={`size-5 object-contain${active ? " [filter:invert(48%)_sepia(79%)_saturate(2476%)_hue-rotate(196deg)_brightness(101%)_contrast(101%)]" : ""}`}
      aria-hidden
    />
  );
}

function RecommendedIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`size-5 ${active ? "text-[#5099fe]" : "text-[#666666]"}`}
      aria-hidden
    >
      <path
        d="M12 3.5 14.5 8.6l5.6.8-4.1 4 1 5.6-5-2.6L7 19l1-5.6-4.1-4 5.6-.8L12 3.5z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function LocationIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`size-5 ${active ? "text-[#5099fe]" : "text-[#666666]"}`}
      aria-hidden
    >
      <path
        d="M12 21s6-5.5 6-11a6 6 0 0 0-12 0c0 5.5 6 11 6 11z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="10" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function ToolbarItem({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 py-2.5 text-[11px] active:opacity-80 ${
        active ? "text-[#5099fe]" : "text-[#666666]"
      }`}
    >
      {icon}
      <span className="leading-none">{label}</span>
    </button>
  );
}

export function HotelListToolbar({ activeId, filtered = false, onSelect }: HotelListToolbarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#eeeeee] bg-white pb-[max(0.25rem,env(safe-area-inset-bottom))] shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
      <div className="mx-auto grid max-w-lg grid-cols-4">
        <ToolbarItem
          active={activeId === "recommended"}
          label="推荐"
          icon={<RecommendedIcon active={activeId === "recommended"} />}
          onClick={() => onSelect("recommended")}
        />
        <ToolbarItem
          active={activeId === "priceStar"}
          label="价格星级"
          icon={<ToolbarImageIcon src={priceIcon} active={activeId === "priceStar"} />}
          onClick={() => onSelect("priceStar")}
        />
        <ToolbarItem
          active={activeId === "location"}
          label="区域位置"
          icon={<LocationIcon active={activeId === "location"} />}
          onClick={() => onSelect("location")}
        />
        <ToolbarItem
          active={activeId === "filter" || filtered}
          label={filtered ? "已筛选" : "筛选"}
          icon={<ToolbarImageIcon src={filterIcon} active={activeId === "filter" || filtered} />}
          onClick={() => onSelect("filter")}
        />
      </div>
    </div>
  );
}
