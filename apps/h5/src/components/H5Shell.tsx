import type { ReactNode } from "react";

import { getAppName } from "@/lib/env";

interface H5ShellProps {
  children: ReactNode;
}

export function H5Shell({ children }: H5ShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="border-b px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <p className="text-lg font-semibold">{getAppName()}</p>
        <p className="text-sm text-muted-foreground">Mobile H5</p>
      </header>
      <main className="flex-1 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {children}
      </main>
    </div>
  );
}
