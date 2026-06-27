import type { ReactNode } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

import { HOME_ASSETS } from "@/config/home-assets";

const TAB_ACTIVE = "var(--brand-primary)";
const TAB_INACTIVE = "#9CA3AF";

interface TabItem {
  to: string;
  label: string;
  icon: (active: boolean) => ReactNode;
}

function TabIcon({ src }: { src: string }) {
  return <img src={src} alt="" className="h-6 w-[23px] object-contain" aria-hidden />;
}

const TABS: TabItem[] = [
  {
    to: "/home",
    label: "首页",
    icon: (active) => (
      <TabIcon src={active ? HOME_ASSETS.tabBar.home.active : HOME_ASSETS.tabBar.home.inactive} />
    ),
  },
  {
    to: "/home/orders",
    label: "订单",
    icon: (active) => (
      <TabIcon
        src={active ? HOME_ASSETS.tabBar.orders.active : HOME_ASSETS.tabBar.orders.inactive}
      />
    ),
  },
  {
    to: "/home/mine",
    label: "我的",
    icon: (active) => (
      <TabIcon
        src={active ? HOME_ASSETS.tabBar.profile.active : HOME_ASSETS.tabBar.profile.inactive}
      />
    ),
  },
];

export function TabLayout() {
  const { pathname } = useLocation();
  const lockMainScroll = pathname === "/home/orders";

  return (
    <div
      className={`flex flex-col bg-[#F5F6F9] text-foreground ${
        lockMainScroll ? "h-dvh overflow-hidden" : "min-h-dvh"
      }`}
    >
      <main
        className={`flex min-h-0 flex-1 flex-col pb-[calc(3.5rem+env(safe-area-inset-bottom))] ${
          lockMainScroll ? "overflow-hidden" : "overflow-y-auto"
        }`}
      >
        <Outlet />
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E8EAED] bg-white"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Main navigation"
      >
        <div className="mx-auto flex h-14 max-w-lg items-stretch justify-around">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === "/home"}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] no-underline"
            >
              {({ isActive }) => (
                <>
                  {tab.icon(isActive)}
                  <span
                    className="leading-none"
                    style={{ color: isActive ? TAB_ACTIVE : TAB_INACTIVE }}
                  >
                    {tab.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
