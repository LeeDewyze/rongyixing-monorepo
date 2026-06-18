import type { ReactNode } from "react";

import { getAppName } from "@/lib/env";

interface WebShellProps {
  children: ReactNode;
}

export function WebShell({ children }: WebShellProps) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="hidden border-b bg-muted/40 px-4 py-2 text-center text-sm text-muted-foreground max-[767px]:block">
        For the full mobile experience, visit the H5 app.
      </div>
      <div className="mx-auto flex min-h-dvh max-w-[1600px]">
        <aside className="hidden w-64 shrink-0 border-r bg-card p-4 pc:block">
          <p className="text-lg font-semibold">{getAppName()}</p>
          <p className="mt-2 text-sm text-muted-foreground">PC layout</p>
        </aside>
        <aside className="hidden w-20 shrink-0 border-r bg-card p-2 pad:block pc:hidden">
          <div className="mx-auto size-10 rounded-md bg-primary/10" />
        </aside>
        <main className="flex-1 p-4 pad:p-6 pc:p-8 pointer-coarse:p-5">{children}</main>
      </div>
    </div>
  );
}
