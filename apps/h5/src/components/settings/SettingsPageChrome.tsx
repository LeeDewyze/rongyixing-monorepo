import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface SettingsPageChromeProps {
  title: string;
  backTo?: string;
  rightAction?: ReactNode;
  children: ReactNode;
}

export function SettingsPageChrome({
  title,
  backTo = "/home/mine",
  rightAction,
  children,
}: SettingsPageChromeProps) {
  const navigate = useNavigate();

  return (
    <div
      className="flex min-h-full flex-col bg-[#F5F6F9]"
      style={{ background: "var(--brand-form-header-gradient)" }}
    >
      <div className="shrink-0 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center px-1 pb-3 pt-1">
          <button
            type="button"
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-brand-title active:bg-white/30"
            aria-label="返回"
            onClick={() => navigate(backTo)}
          >
            <svg
              viewBox="0 0 20 20"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 5l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="min-w-0 flex-1 text-center text-[17px] font-semibold tracking-[0.01em] text-brand-title">
            {title}
          </h1>
          <div className="flex min-w-14 shrink-0 items-center justify-end px-1">{rightAction}</div>
        </div>
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
