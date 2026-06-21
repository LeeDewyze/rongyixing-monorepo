import { OrderListTabId } from "@ryx/shared-types";

import { HOME_ASSETS } from "@/config/home-assets";

const PRODUCT_ICONS: Record<OrderListTabId, string> = {
  [OrderListTabId.Flight]: HOME_ASSETS.products.flight.active,
  [OrderListTabId.Train]: HOME_ASSETS.products.train.active,
  [OrderListTabId.Hotel]: HOME_ASSETS.products.hotel.active,
  [OrderListTabId.Car]: HOME_ASSETS.products.car.active,
};

interface OrderProductIconProps {
  tabId: OrderListTabId;
}

export function OrderProductIcon({ tabId }: OrderProductIconProps) {
  return (
    <span className="inline-flex size-8 shrink-0 overflow-hidden rounded-[8px]">
      <img
        src={PRODUCT_ICONS[tabId]}
        alt=""
        className="size-full scale-[1.12] object-cover"
        aria-hidden
      />
    </span>
  );
}
