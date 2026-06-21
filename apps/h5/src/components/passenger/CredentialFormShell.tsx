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
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#f5f7fa]">
      <div className="shrink-0 bg-gradient-to-b from-[#d6e4ff] to-[#f5f7fa] pt-[env(safe-area-inset-top)]">
        <div className="relative flex h-11 items-center px-1">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center text-2xl text-[#333333] active:opacity-70"
            onClick={onBack}
            aria-label="返回"
          >
            ‹
          </button>
          <h1 className="pointer-events-none absolute inset-x-11 truncate text-center text-base font-semibold text-[#333333]">
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
