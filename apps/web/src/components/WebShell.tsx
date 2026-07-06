import type { ReactNode } from "react";

import { WebSidebarNav } from "@/app/layouts/WebSidebarNav";
import { getAppName } from "@/lib/env";

/** Standard inset for pages inside WebShell main (not used on full-bleed order list). */
export const WEB_MAIN_PADDING_CLASS = "p-4 pad:p-6 pc:p-8 pointer-coarse:p-5";

interface WebShellProps {
  children: ReactNode;
}

export function WebShell({ children }: WebShellProps) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#F5F6F9] text-foreground">
      <div className="hidden shrink-0 border-b bg-muted/40 px-4 py-2 text-center text-sm text-muted-foreground max-[767px]:block">
        For the full mobile experience, visit the H5 app.
      </div>
      <div className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 overflow-hidden">
        <aside className="hidden h-full w-[88px] shrink-0 border-r bg-white px-2 pad:flex pad:flex-col pc:w-56 pc:px-4 pc:py-4">
          <p className="mb-4 hidden text-lg font-semibold text-brand-title pc:block">
            {getAppName()}
          </p>
          <div className="flex flex-1 flex-col justify-center pc:flex-none pc:justify-start">
            <WebSidebarNav />
          </div>
        </aside>
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain">
          {children}
        </main>
      </div>
    </div>
  );
}
