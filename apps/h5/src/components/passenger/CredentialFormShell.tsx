import type { ReactNode } from "react";

interface CredentialFormShellProps {
  title: string;
  onBack: () => void;
  children: ReactNode;
  footer: ReactNode;
}

/** Full-screen credential form chrome — picker-style gradient header + scroll body + fixed footer. */
export function CredentialFormShell({
  title,
  onBack,
  children,
  footer,
}: CredentialFormShellProps) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: "var(--brand-form-header-gradient)" }}>
      <div className="shrink-0 pt-[env(safe-area-inset-top)]">
        <div className="relative flex h-11 items-center px-1">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center text-2xl text-brand-title active:opacity-70"
            onClick={onBack}
            aria-label="返回"
          >
            ‹
          </button>
          <h1 className="pointer-events-none absolute inset-x-11 truncate text-center text-base font-semibold text-brand-title">
            {title}
          </h1>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-4">{children}</div>

      <div className="shrink-0 border-t border-[#eeeeee] bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {footer}
      </div>
    </div>
  );
}
