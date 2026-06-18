import type { ReactNode } from "react";

interface DesignScreenProps {
  children: ReactNode;
}

/** Full-viewport screen scaled to 750px-wide MasterGo artboard. */
export function DesignScreen({ children }: DesignScreenProps) {
  return (
    <div
      className="relative mx-auto w-full overflow-hidden bg-[#0a1628] @container"
      style={{
        minHeight: "100dvh",
        height: "100dvh",
        containerType: "inline-size",
      }}
    >
      {children}
    </div>
  );
}
