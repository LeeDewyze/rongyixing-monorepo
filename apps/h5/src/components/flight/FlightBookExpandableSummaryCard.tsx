import type { ReactNode } from "react";

interface FlightBookExpandableSummaryCardProps {
  name: string;
  subtitle: string;
  expanded: boolean;
  onToggleExpanded: () => void;
  footerAction?: ReactNode;
  children?: ReactNode;
}

/** Gray summary card with「全部信息」expand — shared by passenger & authorized blocks. */
export function FlightBookExpandableSummaryCard({
  name,
  subtitle,
  expanded,
  onToggleExpanded,
  footerAction,
  children,
}: FlightBookExpandableSummaryCardProps) {
  return (
    <div className="rounded-lg bg-[#f6f8fc] px-3 pt-3">
      <div className="relative pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 pr-2">
            <p className="text-[16px] font-semibold text-[#222222]">{name}</p>
            <p className="mt-1 truncate pr-7 text-[14px] leading-tight text-[#999999]">{subtitle}</p>
          </div>
          <button
            type="button"
            className="shrink-0 text-[14px] text-[#5099fe] active:opacity-70"
            onClick={onToggleExpanded}
            aria-expanded={expanded}
          >
            全部信息
          </button>
        </div>

        {footerAction ? <div className="absolute bottom-3 right-0">{footerAction}</div> : null}
      </div>

      {expanded && children ? (
        <div className="border-t border-[#e8ebf0] pb-3 pt-1">{children}</div>
      ) : null}
    </div>
  );
}

export function FlightBookCredentialSwitchButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex size-5 items-center justify-center rounded-full border border-[#5099fe] text-[16px] font-light leading-none text-[#5099fe] active:opacity-70"
      aria-label="选择证件"
    >
      +
    </button>
  );
}

export function FlightBookSectionAddButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="mt-3 flex w-full items-center justify-center gap-1.5 py-2 text-[16px] font-medium text-[#5099fe] active:opacity-70"
      onClick={onClick}
    >
      <span className="flex size-5 items-center justify-center rounded-full border border-[#5099fe] text-[18px] leading-none">
        +
      </span>
      {label}
    </button>
  );
}
