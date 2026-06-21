import filterIcon from "@/assets/flight/toolbar-filter.png";
import priceIcon from "@/assets/flight/toolbar-price.png";
import timeIcon from "@/assets/flight/toolbar-time.png";

export type FlightListSort = "time" | "price";

interface FlightListToolbarProps {
  onFilterClick: () => void;
  sort: FlightListSort;
  onSortChange: (sort: FlightListSort) => void;
  filterActive?: boolean;
}

export function FlightListToolbar({
  onFilterClick,
  sort,
  onSortChange,
  filterActive = false,
}: FlightListToolbarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#eeeeee] bg-white pb-[max(0.25rem,env(safe-area-inset-bottom))] shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
      <div className="mx-auto grid max-w-lg grid-cols-3">
        <ToolbarButton
          active={filterActive}
          icon={filterIcon}
          label="筛选"
          onClick={onFilterClick}
        />
        <ToolbarButton
          active={sort === "time"}
          icon={timeIcon}
          label="时间"
          onClick={() => onSortChange("time")}
        />
        <ToolbarButton
          active={sort === "price"}
          icon={priceIcon}
          label="价格"
          onClick={() => onSortChange("price")}
        />
      </div>
    </div>
  );
}

function ToolbarButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`flex flex-col items-center gap-1 py-2.5 text-[11px] ${
        active ? "text-[#5099fe]" : "text-[#666666]"
      }`}
      onClick={onClick}
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
      {label}
    </button>
  );
}
