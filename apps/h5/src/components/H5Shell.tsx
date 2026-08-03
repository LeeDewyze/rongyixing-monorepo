import type { ReactNode } from "react";

interface H5ShellProps {
  children: ReactNode;
  header?: ReactNode;
}

export function H5Shell({ children, header }: H5ShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-[#F5F6F9] text-foreground">
      {header}
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#F5F6F9] pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {children}
      </main>
    </div>
  );
}
