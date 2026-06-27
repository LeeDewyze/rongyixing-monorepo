import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { PROFILE_ASSETS } from "@/config/profile-assets";

function ChevronRightIcon() {
  return (
    <img
      src={PROFILE_ASSETS.menu.chevronRight}
      alt=""
      className="size-4 shrink-0 object-contain"
      aria-hidden
    />
  );
}

export interface ProfileMenuItem {
  id: string;
  label: string;
  icon: ReactNode;
  to?: string;
  comingSoon?: boolean;
}

interface ProfileMenuListProps {
  items: ProfileMenuItem[];
}

const rowClassName =
  "flex h-[42px] w-full items-center gap-1 border-none bg-transparent pl-2 pr-4 text-left no-underline";

function MenuRowContent({ item }: { item: ProfileMenuItem }) {
  return (
    <>
      <span className="flex size-[42px] shrink-0 items-center justify-center">{item.icon}</span>
      <span className="min-w-0 flex-1 text-[16px] font-medium leading-none tracking-normal text-brand-title [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]">
        {item.label}
      </span>
      <ChevronRightIcon />
    </>
  );
}

/** Figma 23:2495 — each menu row is a separate white card (351×42, radius 8px). */
export function ProfileMenuList({ items }: ProfileMenuListProps) {
  return (
    <div className="mx-3 mt-2 flex flex-col gap-2 pb-4">
      {items.map((item) => {
        const card = (
          <div className="h-[42px] overflow-hidden rounded-lg bg-white">
            {item.to && !item.comingSoon ? (
              <Link to={item.to} className={rowClassName}>
                <MenuRowContent item={item} />
              </Link>
            ) : (
              <button
                type="button"
                className={rowClassName}
                aria-label={`${item.label}（即将上线）`}
              >
                <MenuRowContent item={item} />
              </button>
            )}
          </div>
        );

        return <div key={item.id}>{card}</div>;
      })}
    </div>
  );
}
