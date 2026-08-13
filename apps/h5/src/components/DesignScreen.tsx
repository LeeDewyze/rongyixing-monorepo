import type { ReactNode } from "react";

interface DesignScreenProps {
  children: ReactNode;
}

/** Full-viewport screen scaled to 750px-wide MasterGo artboard. */
export function DesignScreen({ children }: DesignScreenProps) {
  return (
    <div
      className="relative mx-auto w-full bg-[#0a1628] @container"
      style={{
        minHeight: "var(--ryx-viewport-height, 100dvh)",
        maxWidth: "var(--ryx-design-width, 480px)",
        containerType: "inline-size",
      }}
    >
      {children}
    </div>
  );
}
