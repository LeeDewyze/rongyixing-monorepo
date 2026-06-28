import { useNavigate } from "react-router-dom";

import type { OrderCategoryId } from "@/components/order/OrderCategoryTabs";
import { HOME_ASSETS } from "@/config/home-assets";
import { TAB_ID_TO_PARAM } from "@/lib/order-list-params";

interface ProfileService {
  id: OrderCategoryId;
  label: string;
  icon: string;
  comingSoon?: boolean;
}

const SERVICES: ProfileService[] = [
  {
    id: "flight",
    label: "机票",
    icon: HOME_ASSETS.products.flight.active,
  },
  {
    id: "train",
    label: "火车票",
    icon: HOME_ASSETS.products.train.active,
  },
  {
    id: "hotel",
    label: "酒店",
    icon: HOME_ASSETS.products.hotel.active,
  },
];

/** Figma 23:2495 — service panel fade (375×110, radius 20px). */
const PROFILE_SERVICE_PANEL_BACKGROUND =
  "linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, #F5F6F9 99.64%)";

export function ProfileServiceGrid() {
  const navigate = useNavigate();

  function handleClick(service: ProfileService) {
    if (service.comingSoon) {
      return;
    }
    navigate(`/home/orders?tab=${TAB_ID_TO_PARAM[service.id]}`);
  }

  return (
    <section className="relative z-10 -mt-8 flex h-[110px] w-full items-center overflow-hidden rounded-[20px] bg-white px-2">
      <div
        className="pointer-events-none absolute inset-0 rounded-[20px]"
        style={{ background: PROFILE_SERVICE_PANEL_BACKGROUND }}
        aria-hidden
      />
      <div className="relative grid w-full grid-cols-3">
        {SERVICES.map((service) => (
          <button
            key={service.id}
            type="button"
            className="flex flex-col items-center gap-2 border-none bg-transparent p-0"
            aria-label={service.comingSoon ? `${service.label}（即将上线）` : service.label}
            onClick={() => handleClick(service)}
          >
            <img src={service.icon} alt="" className="size-11 object-contain" aria-hidden />
            <span className="text-[14px] leading-none text-[#333333]">{service.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
