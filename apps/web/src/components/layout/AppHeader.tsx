import type { CSSProperties, ReactNode } from "react";

/** Page header tones — see docs/融易蓝设计规范.md */
export type AppHeaderTone = "brand" | "form";

export interface AppHeaderProps {
  title?: ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  right?: ReactNode;
  /** Content below the toolbar, still inside the header block. */
  extended?: ReactNode;
  tone?: AppHeaderTone;
}

function BackChevron({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 10 17" className={className} aria-hidden>
      <path
        d="M9 1.5 2.5 8.5 9 15.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AppHeader({
  title,
  showBack = false,
  onBack,
  right,
  extended,
  tone = "brand",
}: AppHeaderProps) {
  const isForm = tone === "form";

  const headerClassName = isForm
    ? "sticky top-0 z-50 shrink-0 w-full text-brand-title"
    : "sticky top-0 z-50 shrink-0 w-full bg-gradient-to-b from-brand-header-start to-brand-header-end text-white";

  const headerStyle: CSSProperties | undefined = isForm
    ? { background: "var(--brand-form-header-gradient)" }
    : undefined;

  return (
    <header className={headerClassName} {...(headerStyle ? { style: headerStyle } : {})}>
      <div className="pt-[env(safe-area-inset-top)]">
        <div className="relative flex h-11 items-center px-1">
          <div className="flex w-12 shrink-0 items-center justify-start">
            {showBack ? (
              <button
                type="button"
                className={`flex h-11 w-11 items-center justify-center active:opacity-70 ${
                  isForm ? "text-brand-title" : "text-2xl leading-none"
                }`}
                onClick={onBack}
                aria-label="返回"
              >
                {isForm ? <BackChevron className="h-[17px] w-[10px] shrink-0" /> : "‹"}
              </button>
            ) : (
              <span className="w-11" aria-hidden />
            )}
          </div>
          <div className="pointer-events-none absolute inset-x-12 flex h-11 items-center justify-center px-2">
            {title ? (
              <h1 className={`truncate text-base font-medium ${isForm ? "text-brand-title" : ""}`}>
                {title}
              </h1>
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
