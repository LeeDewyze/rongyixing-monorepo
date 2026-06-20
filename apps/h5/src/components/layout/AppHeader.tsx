import type { ReactNode } from "react";

import { BRAND_HEADER_BG } from "@/config/brand";

export interface AppHeaderProps {
  title?: ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  right?: ReactNode;
  /** Content below the toolbar, still inside the blue header block. */
  extended?: ReactNode;
}

export function AppHeader({
  title,
  showBack = false,
  onBack,
  right,
  extended,
}: AppHeaderProps) {
  return (
    <header
      className="sticky top-0 z-50 shrink-0 text-white"
      style={{ backgroundColor: BRAND_HEADER_BG }}
    >
      <div className="pt-[env(safe-area-inset-top)]">
        <div className="relative flex h-11 items-center px-1">
          <div className="flex w-12 shrink-0 items-center justify-start">
            {showBack ? (
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center text-2xl leading-none active:opacity-70"
                onClick={onBack}
                aria-label="返回"
              >
                ‹
              </button>
            ) : (
              <span className="w-11" aria-hidden />
            )}
          </div>
          <div className="pointer-events-none absolute inset-x-12 flex h-11 items-center justify-center px-2">
            {title ? (
              <h1 className="truncate text-base font-medium">{title}</h1>
            ) : null}
          </div>
          <div className="ml-auto flex w-12 shrink-0 items-center justify-end pr-1">
            {right ?? null}
          </div>
        </div>
        {extended}
      </div>
    </header>
  );
}
