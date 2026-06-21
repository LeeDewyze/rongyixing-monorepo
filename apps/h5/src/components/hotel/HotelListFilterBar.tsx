import filterChevronDownIcon from "@/assets/hotel/filter-chevron-down.svg";

export type HotelListFilterId = "recommended" | "priceStar" | "location" | "filter";

const FILTER_TABS: { id: HotelListFilterId; label: string }[] = [
  { id: "recommended", label: "推荐" },
  { id: "priceStar", label: "星级/价格" },
  { id: "location", label: "区域位置" },
  { id: "filter", label: "筛选" },
];

function ChevronDownIcon() {
  return (
    <img
      src={filterChevronDownIcon}
      alt=""
      className="size-4 shrink-0 object-contain"
      aria-hidden
    />
  );
}

const FILTER_FONT = "[font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]";

interface HotelListFilterBarProps {
  activeId?: HotelListFilterId | null;
  onSelect?: (id: HotelListFilterId) => void;
}

export function HotelListFilterBar({ activeId, onSelect }: HotelListFilterBarProps) {
  return (
    <div className="mt-4 flex items-center justify-around px-3 pb-2 pt-3">
      {FILTER_TABS.map((tab) => {
        const active = activeId === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            className={`flex items-center justify-center gap-0.5 text-center text-[14px] font-medium leading-none tracking-normal ${FILTER_FONT} ${
              active ? "text-[#2768FA]" : "text-[#010101]"
            }`}
            onClick={() => onSelect?.(tab.id)}
          >
            {tab.label}
            <ChevronDownIcon />
          </button>
        );
      })}
    </div>
  );
}
