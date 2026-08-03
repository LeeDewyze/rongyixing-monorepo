import type { ReactNode } from "react";

import { HOME_ASSETS } from "@/config/home-assets";

export function WebCalendarIcon() {
  return (
    <img src={HOME_ASSETS.calendar} alt="" className="size-6 shrink-0 object-contain" aria-hidden />
  );
}

export function WebLabeledField({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <span className="text-xs font-normal text-[#999999]">{label}</span>
      <div className="mt-1.5 border-b border-[#E8E8E8] pb-2">{children}</div>
    </div>
  );
}

export function WebSearchButton({
  label,
  onClick,
  className = "",
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl px-6 text-[18px] font-medium leading-none text-white hover:opacity-95 [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif] pointer-coarse:min-h-[52px] pc:min-w-[148px] ${className}`}
      style={{
        background: "linear-gradient(270deg, #2768FA 0%, #33A1F9 100%)",
        boxShadow: "0px 2px 16px 0px rgba(39, 104, 250, 0.25)",
      }}
      onClick={onClick}
    >
      <img
        src={HOME_ASSETS.flightSearchIcon}
        alt=""
        className="size-5 shrink-0 object-contain"
        aria-hidden
      />
      {label}
    </button>
  );
}

export function WebFieldValue({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      className={`flex min-h-8 w-full items-center gap-2 text-left text-[17px] font-medium text-brand-title [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif] ${className}`}
      onClick={onClick}
    >
      {children}
    </Tag>
  );
}
