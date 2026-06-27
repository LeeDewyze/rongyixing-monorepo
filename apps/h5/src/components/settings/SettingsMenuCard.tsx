import type { ReactNode } from "react";

import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";
import { PROFILE_ASSETS } from "@/config/profile-assets";

interface SettingsMenuCardProps {
  children: ReactNode;
}

export const SETTINGS_MENU_CARD_CLASS =
  "mx-3 overflow-hidden rounded-2xl bg-white shadow-[0_4px_20px_rgba(15,23,42,0.06)] ring-1 ring-black/[0.03]";

export function SettingsMenuCard({ children }: SettingsMenuCardProps) {
  return <div className={`${SETTINGS_MENU_CARD_CLASS} ${HOTEL_DETAIL_FONT}`}>{children}</div>;
}

function SettingsChevron() {
  return (
    <img
      src={PROFILE_ASSETS.menu.chevronRight}
      alt=""
      className="size-4 shrink-0 object-contain opacity-70"
      aria-hidden
    />
  );
}

interface SettingsMenuRowProps {
  label: string;
  description?: string;
  icon?: ReactNode;
  value?: ReactNode;
  valueTone?: "default" | "primary" | "hint";
  showChevron?: boolean;
  destructive?: boolean;
  onClick?: () => void;
  borderless?: boolean;
}

const VALUE_TONE_CLASS = {
  default: "text-[14px] text-[#8A94A6]",
  primary: "text-[14px] font-medium text-brand-primary",
  hint: "text-[13px] text-[#8A94A6]",
} as const;

export function SettingsMenuRow({
  label,
  description,
  icon,
  value,
  valueTone = "default",
  showChevron = true,
  destructive = false,
  onClick,
  borderless = false,
}: SettingsMenuRowProps) {
  const content = (
    <>
      {icon ? <span className="shrink-0">{icon}</span> : null}
      <span className="min-w-0 flex-1">
        <span
          className={`block truncate text-[16px] font-medium leading-snug ${
            destructive ? "text-[#FF4D4F]" : "text-brand-title"
          }`}
        >
          {label}
        </span>
        {description ? (
          <span className="mt-0.5 block text-[12px] leading-relaxed text-[#8A94A6]">
            {description}
          </span>
        ) : null}
      </span>
      {value ? (
        <span className={`shrink-0 whitespace-nowrap text-right ${VALUE_TONE_CLASS[valueTone]}`}>
          {value}
        </span>
      ) : null}
      {showChevron && onClick ? <SettingsChevron /> : null}
    </>
  );

  const className = `flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors ${
    borderless ? "" : "border-b border-[#EEF0F4] last:border-b-0"
  } ${onClick ? "active:bg-[#F8FAFC]" : ""}`;

  if (!onClick) {
    return <div className={className}>{content}</div>;
  }

  return (
    <button type="button" className={className} onClick={onClick}>
      {content}
    </button>
  );
}
