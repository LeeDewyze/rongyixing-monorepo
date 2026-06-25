import type { ReactNode } from "react";

import credentialSwitchPlusIcon from "@/assets/hotel/credential-switch-plus.png";

interface FlightBookExpandableSummaryCardProps {
  name: string;
  subtitle: string;
  expanded: boolean;
  onToggleExpanded: () => void;
  footerAction?: ReactNode;
  children?: ReactNode;
  /** `muted` = gray inset (flight); `plain` = white card (hotel room). */
  surface?: "muted" | "plain";
  className?: string;
}

/** Chevron beside「全部信息 / 收起」— down when collapsed, up when expanded. */
function ExpandToggleChevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={`size-3 shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 4.5 6 7.5 9 4.5" />
    </svg>
  );
}

/** Gray summary card with「全部信息」expand — shared by passenger & authorized blocks. */
export function FlightBookExpandableSummaryCard({
  name,
  subtitle,
  expanded,
  onToggleExpanded,
  footerAction,
  children,
  surface = "muted",
  className = "",
}: FlightBookExpandableSummaryCardProps) {
  const surfaceClass =
    surface === "plain"
      ? "bg-white px-3.5 pb-3.5 pt-3.5"
      : "bg-[#F8F9FC] px-3 pb-3 pt-3";

  return (
    <div className={`${surfaceClass} ${className}`.trim()}>
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 flex-1 text-[16px] font-semibold leading-tight text-[#222222]">
          {name}
        </p>
        <button
          type="button"
          className="flex shrink-0 items-center gap-0.5 pt-0.5 text-[13px] font-medium text-[#2768FA] active:opacity-70"
          onClick={onToggleExpanded}
          aria-expanded={expanded}
        >
          {expanded ? "收起" : "全部信息"}
          <ExpandToggleChevron expanded={expanded} />
        </button>
      </div>

      <div className="mt-1.5 flex items-center gap-2">
        <p className="min-w-0 flex-1 truncate text-[13px] leading-tight text-[#999999]">
          {subtitle}
        </p>
        {footerAction ? <div className="shrink-0">{footerAction}</div> : null}
      </div>

      {expanded && children ? (
        <div className="mt-3 space-y-3 border-t border-[#E8EBF0] pt-3">{children}</div>
      ) : null}
    </div>
  );
}

export function FlightBookCredentialSwitchButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex size-5 shrink-0 items-center justify-center active:opacity-70"
      aria-label="选择证件"
    >
      <img src={credentialSwitchPlusIcon} alt="" className="size-5" aria-hidden />
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
      className="mt-3 flex h-[42px] w-full items-center justify-center gap-1.5 text-[12px] font-normal leading-none text-[#2768FA] active:opacity-70"
      onClick={onClick}
    >
      <img src={credentialSwitchPlusIcon} alt="" className="size-4" aria-hidden />
      {label}
    </button>
  );
}
