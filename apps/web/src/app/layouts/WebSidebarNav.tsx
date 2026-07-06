import { NavLink } from "react-router-dom";

import { HOME_ASSETS } from "@/config/home-assets";

const NAV_ITEMS = [
  {
    to: "/",
    label: "首页",
    icon: HOME_ASSETS.tabBar.home,
    end: true,
  },
  {
    to: "/orders",
    label: "订单",
    icon: HOME_ASSETS.tabBar.orders,
    end: false,
  },
  {
    to: "/mine",
    label: "我的",
    icon: HOME_ASSETS.tabBar.profile,
    end: false,
  },
] as const;

export function WebSidebarNav() {
  return (
    <nav className="flex flex-col gap-16 pc:gap-3" aria-label="主导航">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `flex min-h-11 flex-col items-center justify-center gap-2 rounded-lg px-2 py-1 text-xs transition-colors pointer-coarse:min-h-12 pc:flex-row pc:justify-start pc:gap-3 pc:px-4 pc:py-3 pc:text-sm ${
              isActive
                ? "bg-brand-primary/10 font-medium text-brand-primary"
                : "text-[#666666] hover:bg-muted/60"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <img
                src={isActive ? item.icon.active : item.icon.inactive}
                alt=""
                className="size-7 shrink-0 object-contain pc:size-5"
                aria-hidden
              />
              <span className="leading-none">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
