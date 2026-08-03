import type { ReactNode } from "react";

/** Section title with blue accent bar — Pad/PC home design. */
export function WebSectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-[20px] font-medium leading-none text-[#010101] [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]">
      <span
        className="h-6 w-3 shrink-0 rounded-full"
        style={{
          background: "linear-gradient(167.67deg, #2768FA 7.1%, #33A1F9 86.18%)",
        }}
        aria-hidden
      />
      {children}
    </h2>
  );
}
