import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";

interface H5ShellProps {
  children: ReactNode;
  header?: ReactNode;
}

function normalizePathname(pathname: string): string {
  const normalized = pathname.replace(/\/+$/g, "");
  return normalized || "/";
}

function usesInternalViewportScroll(pathname: string): boolean {
  const path = normalizePathname(pathname);

  return (
    path === "/orders" ||
    path.startsWith("/orders/") ||
    path === "/flight/list" ||
    path === "/flight/book" ||
    /^\/flight\/[^/]+\/cabins$/.test(path) ||
    path === "/train/list" ||
    path === "/train/book" ||
    path === "/hotel/list" ||
    /^\/hotel\/[^/]+\/book$/.test(path) ||
    /^\/(?:flight|hotel|train)\/pay\/[^/]+$/.test(path) ||
    path === "/travel/apply" ||
    path === "/travel/approval" ||
    path === "/travel/task" ||
    path === "/credentials"
  );
}

export function H5Shell({ children, header }: H5ShellProps) {
  const { pathname } = useLocation();
  const internalViewportScroll = usesInternalViewportScroll(pathname);

  return (
    <div
      className={`flex flex-col bg-[#F5F6F9] text-foreground ${
        internalViewportScroll ? "ryx-viewport-h overflow-hidden" : "ryx-viewport-min"
      }`}
    >
      {header}
      <main
        className={`flex min-h-0 flex-1 flex-col bg-[#F5F6F9] ${
          internalViewportScroll
            ? "overflow-hidden pb-0"
            : "overflow-y-auto touch-pan-y pb-[max(0.5rem,env(safe-area-inset-bottom))]"
        }`}
      >
        {children}
      </main>
    </div>
  );
}
