import type { ReactNode } from "react";
import { NavLink, Outlet } from "react-router-dom";

const TAB_ACTIVE = "#2276DD";
const TAB_INACTIVE = "#9CA3AF";

interface TabItem {
  to: string;
  label: string;
  icon: (active: boolean) => ReactNode;
}

function HomeIcon({ active }: { active: boolean }) {
  const color = active ? TAB_ACTIVE : TAB_INACTIVE;
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden>
      {active ? (
        <path
          d="M12 3.5 4 10.2V20a1.5 1.5 0 0 0 1.5 1.5H9v-5.5h6V21.5h3.5A1.5 1.5 0 0 0 20 20V10.2L12 3.5Z"
          fill={color}
        />
      ) : (
        <path
          d="M12 4.2 5 10v9.5h4.5v-5H14.5v5H19V10L12 4.2ZM12 2l9 7.5V21a1 1 0 0 1-1 1h-5.5v-5.5H9.5V22H4a1 1 0 0 1-1-1v-11.5L12 2Z"
          fill={color}
        />
      )}
    </svg>
  );
}

function TripIcon({ active }: { active: boolean }) {
  const color = active ? TAB_ACTIVE : TAB_INACTIVE;
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth="1.5" />
      <path
        d="M7.5 12c2-3.5 7-3.5 9 0"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M16.5 9.5 18 8l1 1.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  const color = active ? TAB_ACTIVE : TAB_INACTIVE;
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth="1.5" />
      <circle cx="12" cy="10" r="2.5" stroke={color} strokeWidth="1.5" />
      <path
        d="M8.5 16.5c.8-1.8 2.2-2.8 3.5-2.8s2.7 1 3.5 2.8"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const TABS: TabItem[] = [
  {
    to: "/home",
    label: "首页",
    icon: (active) => <HomeIcon active={active} />,
  },
  {
    to: "/home/trips",
    label: "待出行",
    icon: (active) => <TripIcon active={active} />,
  },
  {
    to: "/home/mine",
    label: "我的",
    icon: (active) => <ProfileIcon active={active} />,
  },
];

export function TabLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-[#F5F6F8] text-foreground">
      <main className="flex-1 overflow-y-auto pb-[calc(3.5rem+env(safe-area-inset-bottom))]">
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
