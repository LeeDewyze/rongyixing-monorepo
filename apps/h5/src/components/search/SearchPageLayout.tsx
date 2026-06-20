import type { ReactNode } from "react";

import { usePageHeader } from "@/components/layout";

interface SearchPageLayoutProps {
  title: string;
  subtitle?: string;
  theme?: "sky" | "amber" | "emerald";
  headerRight?: ReactNode;
  children: ReactNode;
}

const THEMES = {
  sky: "from-[#5099fe] to-[#5099fe]/85",
  amber: "from-amber-600 to-amber-600/80",
  emerald: "from-emerald-600 to-emerald-600/80",
} as const;

/** Shared search page shell: app header + gradient body + card. */
export function SearchPageLayout({
  title,
  subtitle,
  theme = "sky",
  headerRight,
  children,
}: SearchPageLayoutProps) {
  usePageHeader({
    title,
    subtitle,
    showBack: true,
    right: headerRight,
  });

  return (
    <div className={`min-h-full bg-gradient-to-b ${THEMES[theme]} pb-8`}>
      <div className="mx-4 mt-3">{children}</div>
    </div>
  );
}
