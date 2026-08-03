import { Link, useNavigate } from "react-router-dom";

import type { OrderCategoryId } from "@/components/order/OrderCategoryTabs";
import { HOME_ASSETS } from "@/config/home-assets";
import { PROFILE_ASSETS } from "@/config/profile-assets";
import { TAB_ID_TO_PARAM } from "@/lib/order-list-params";

interface OrderShortcut {
  id: OrderCategoryId;
  label: string;
  icon: string;
}

interface MenuShortcut {
  id: string;
  label: string;
  icon: string;
  to: string;
}

const ORDER_SHORTCUTS: OrderShortcut[] = [
  { id: "flight", label: "机票", icon: HOME_ASSETS.products.flight.active },
  { id: "train", label: "火车票", icon: HOME_ASSETS.products.train.active },
  { id: "hotel", label: "酒店", icon: HOME_ASSETS.products.hotel.active },
];

const MENU_SHORTCUTS: MenuShortcut[] = [
  {
    id: "credentials",
    label: "证件管理",
    icon: PROFILE_ASSETS.menu.credentials,
    to: "/credentials",
  },
  { id: "bank-card", label: "银行卡信息", icon: PROFILE_ASSETS.menu.bankCard, to: "/bank-cards" },
  { id: "contact", label: "联系我们", icon: PROFILE_ASSETS.menu.contact, to: "/contact" },
  { id: "settings", label: "设置", icon: PROFILE_ASSETS.menu.settings, to: "/settings" },
];

const SHORTCUT_LABEL_CLASS =
  "text-center text-[16px] font-medium leading-none tracking-normal text-[#333333] [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]";

function OrderShortcutTile({ item, onClick }: { item: OrderShortcut; onClick: () => void }) {
  return (
    <button
      type="button"
      className="flex flex-col items-center gap-3 border-none bg-transparent p-0"
      aria-label={item.label}
      onClick={onClick}
    >
      <img src={item.icon} alt="" className="size-24 rounded-3xl object-cover" aria-hidden />
      <span className={SHORTCUT_LABEL_CLASS}>{item.label}</span>
    </button>
  );
}

function MenuShortcutTile({ item }: { item: MenuShortcut }) {
  return (
    <Link
      to={item.to}
      className="flex flex-col items-center gap-3 no-underline transition-opacity hover:opacity-90 active:opacity-80"
    >
      <span className="flex size-24 items-center justify-center rounded-3xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]">
        <img src={item.icon} alt="" className="size-[72px] object-contain" aria-hidden />
      </span>
      <span className={SHORTCUT_LABEL_CLASS}>{item.label}</span>
    </Link>
  );
}

/** Pad/PC profile shortcuts — 4×2 grid per 我的tab mockup. */
export function ProfilePadShortcutGrid() {
  const navigate = useNavigate();

  function handleOrderShortcut(item: OrderShortcut) {
    navigate(`/orders?tab=${TAB_ID_TO_PARAM[item.id]}`);
  }

  const gridClass =
    "mx-auto grid w-fit grid-cols-4 justify-items-center gap-x-24 gap-y-10 pc:gap-x-32 pc:gap-y-12";

  return (
    <section className={`${gridClass} pb-2 pt-16 pc:pt-20`}>
      {ORDER_SHORTCUTS.map((item) => (
        <OrderShortcutTile key={item.id} item={item} onClick={() => handleOrderShortcut(item)} />
      ))}
      <div aria-hidden className="size-0" />
      {MENU_SHORTCUTS.map((item) => (
        <MenuShortcutTile key={item.id} item={item} />
      ))}
    </section>
  );
}
