import type { HotelOrderActionFlags } from "@ryx/shared-types";

import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";
import { formatTrainOrderHoldBannerMessage } from "@/lib/train-order-detail";

interface TrainOrderHoldBannerProps {
  payHoldSecondsRemaining: number;
  actions?: HotelOrderActionFlags;
}

export function TrainOrderHoldBanner({
  payHoldSecondsRemaining,
  actions,
}: TrainOrderHoldBannerProps) {
  return (
    <div className={`bg-[#FFF1F0] px-4 py-2.5 text-center ${HOTEL_DETAIL_FONT}`}>
      <p className="text-[13px] font-normal leading-snug text-[#FF4D4F]">
        {formatTrainOrderHoldBannerMessage(payHoldSecondsRemaining, actions)}
      </p>
    </div>
  );
}
