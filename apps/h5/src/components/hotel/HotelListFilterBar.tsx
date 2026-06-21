export type HotelListFilterId = "recommended" | "priceStar" | "location" | "filter";

const FILTER_TABS: { id: HotelListFilterId; label: string }[] = [
  { id: "recommended", label: "推荐" },
  { id: "priceStar", label: "星级/价格" },
  { id: "location", label: "位置区域" },
  { id: "filter", label: "筛选" },
];

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 10 6" className="size-[7px] shrink-0" aria-hidden>
      <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

const FILTER_FONT = "[font-family:'Source_Han_Sans_SC','Noto_Sans_SC','PingFang_SC',sans-serif]";

interface HotelListFilterBarProps {
  activeId?: HotelListFilterId | null;
  onSelect?: (id: HotelListFilterId) => void;
}

export function HotelListFilterBar({ activeId, onSelect }: HotelListFilterBarProps) {
  return (
    <div className="flex items-center justify-around px-1 pb-0 pt-3">
      {FILTER_TABS.map((tab) => {
        const active = activeId === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            className={`flex items-center gap-0.5 text-[14px] leading-[20.5px] tracking-[0.5px] ${FILTER_FONT} ${
              active ? "font-medium text-[#5099FE]" : "font-normal text-[#383838]"
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
