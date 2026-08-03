import type { ProfileMenuItem } from "@/components/profile/ProfileMenuSection";
import { PROFILE_ASSETS } from "@/config/profile-assets";

function MenuIcon({ src }: { src: string }) {
  return <img src={src} alt="" className="size-[42px] object-contain" aria-hidden />;
}

/** Figma 23:2495 — profile management rows with exported menu icons. */
export const PROFILE_MENU_ITEMS: ProfileMenuItem[] = [
  {
    id: "credentials",
    label: "证件管理",
    to: "/credentials",
    icon: <MenuIcon src={PROFILE_ASSETS.menu.credentials} />,
  },
  {
    id: "bank-card",
    label: "银行卡信息",
    to: "/bank-cards",
    icon: <MenuIcon src={PROFILE_ASSETS.menu.bankCard} />,
  },
  {
    id: "contact",
    label: "联系我们",
    to: "/contact",
    icon: <MenuIcon src={PROFILE_ASSETS.menu.contact} />,
  },
  {
    id: "settings",
    label: "设置",
    to: "/settings",
    icon: <MenuIcon src={PROFILE_ASSETS.menu.settings} />,
  },
];
