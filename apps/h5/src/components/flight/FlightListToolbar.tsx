import type { FlightSortTab } from "@ryx/shared-types";

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
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto grid max-w-lg grid-cols-3">
        <ToolbarItem
          active={activeTab === "filter"}
          hint={filtered ? "已筛选" : "筛选"}
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
          onClick={onOpenPriceSort}
        />
      </div>
    </div>
  );
}

function ToolbarItem({
  active,
  hint,
  onClick,
}: {
  active: boolean;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center py-3 text-xs ${
        active ? "font-semibold text-primary" : "text-muted-foreground"
      }`}
    >
      {hint}
    </button>
  );
}
