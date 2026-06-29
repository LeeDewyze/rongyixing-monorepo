import type { ReactNode, RefObject } from "react";

export interface PickerShellProps {
  title: string;
  searchPlaceholder: string;
  keyword: string;
  onKeywordChange: (value: string) => void;
  onBack: () => void;
  onSearchClick?: () => void;
  inputRef?: RefObject<HTMLInputElement | null>;
  tabs?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  onBodyScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
  /** Extra nodes positioned over body (e.g. city A–Z index). */
  bodyOverlay?: ReactNode;
  /** `form` aligns full-screen management pickers with credential/list form pages. */
  tone?: "default" | "form";
}

/** Shared full-screen picker chrome — gradient header, search bar, scroll body, optional footer. */
export function PickerShell({
  title,
  searchPlaceholder,
  keyword,
  onKeywordChange,
  onBack,
  onSearchClick,
  inputRef,
  tabs,
  footer,
  children,
  onBodyScroll,
  bodyOverlay,
  tone = "default",
}: PickerShellProps) {
  const isFormTone = tone === "form";

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-[#f5f7fa]"
      style={isFormTone ? { background: "var(--brand-form-header-gradient)" } : undefined}
    >
      <div
        className={
          isFormTone
            ? "shrink-0 pt-[env(safe-area-inset-top)]"
            : "shrink-0 bg-gradient-to-b from-[#d6e4ff] to-[#f5f7fa] pt-[env(safe-area-inset-top)]"
        }
        style={isFormTone ? { background: "var(--brand-form-header-gradient)" } : undefined}
      >
        <div className="relative flex h-11 items-center px-1">
          <button
            type="button"
            className={
              isFormTone
                ? "flex h-11 w-11 items-center justify-center text-[26px] font-light leading-none text-brand-title active:opacity-70"
                : "flex h-11 w-11 items-center justify-center text-2xl text-[#333333] active:opacity-70"
            }
            onClick={onBack}
            aria-label="返回"
          >
            ‹
          </button>
          <h1
            className={
              isFormTone
                ? "pointer-events-none absolute inset-x-11 truncate text-center text-[17px] font-medium text-brand-title"
                : "pointer-events-none absolute inset-x-11 truncate text-center text-base font-semibold text-[#333333]"
            }
          >
            {title}
          </h1>
        </div>

        <div className="px-4 pb-2 pt-1">
          <div
            className={
              isFormTone
                ? "flex h-10 items-center gap-2 rounded-full bg-white/90 px-3 shadow-[0_4px_16px_rgba(39,104,250,0.10)] ring-1 ring-white/60"
                : "flex h-10 items-center gap-2 rounded-full bg-white px-3 shadow-sm"
            }
          >
            <span className="text-sm text-[#999999]" aria-hidden>
              🔍
            </span>
            <input
              ref={inputRef}
              type="search"
              enterKeyHint="search"
              className="min-w-0 flex-1 bg-transparent text-sm text-[#333333] outline-none placeholder:text-[#bbbbbb]"
              placeholder={searchPlaceholder}
              value={keyword}
              onChange={(e) => onKeywordChange(e.target.value)}
            />
            <button
              type="button"
              className="shrink-0 rounded-full px-3 py-1 text-sm font-medium text-brand-accent active:opacity-80"
              style={{ backgroundColor: isFormTone ? "rgba(39, 104, 250, 0.10)" : "#e8eeff" }}
              onClick={onSearchClick}
            >
              搜索
            </button>
          </div>
        </div>

        {tabs}
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto" onScroll={onBodyScroll}>
          {children}
        </div>
        {bodyOverlay}
      </div>

      {footer}
    </div>
  );
}
