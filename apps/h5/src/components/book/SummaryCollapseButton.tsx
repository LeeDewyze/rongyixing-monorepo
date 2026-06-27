import summaryCollapseIcon from "@/assets/flight/summary-collapse-icon.png";

interface SummaryCollapseButtonProps {
  expanded: boolean;
  onToggle: () => void;
  /** Used in aria-label, e.g. 航班详情 / 车次详情 */
  detailLabel?: string;
}

export function SummaryCollapseButton({
  expanded,
  onToggle,
  detailLabel = "详情",
}: SummaryCollapseButtonProps) {
  return (
    <button
      type="button"
      className="flex size-4 shrink-0 items-center justify-center active:opacity-80"
      onClick={onToggle}
      aria-expanded={expanded}
      aria-label={expanded ? `收起${detailLabel}` : `展开${detailLabel}`}
    >
      <img
        src={summaryCollapseIcon}
        alt=""
        width={16}
        height={16}
        className={`size-4 transition-transform duration-200 ${expanded ? "" : "rotate-180"}`}
        aria-hidden
      />
    </button>
  );
}
