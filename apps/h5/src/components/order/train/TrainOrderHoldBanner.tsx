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
    <div className={`px-4 pb-1 pt-3 ${HOTEL_DETAIL_FONT}`}>
      <div
        className="flex min-h-[32px] items-center rounded-full px-3 text-left shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
        style={{ backgroundColor: "rgba(248, 187, 64, 0.1)" }}
      >
        <span className="mr-2.5 flex shrink-0 items-center justify-center text-[#EF6000]/80">
          <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
            <path
              d="M2.75 6.5h2.2l5.3-2.75v8.5L4.95 9.5h-2.2a.75.75 0 0 1-.75-.75v-1.5a.75.75 0 0 1 .75-.75Z"
              fill="currentColor"
              opacity="0.88"
            />
            <path
              d="M11.75 6.15a2.4 2.4 0 0 1 0 3.7M12.95 4.85a4.2 4.2 0 0 1 0 6.3"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.2"
            />
          </svg>
        </span>
        <p className="m-0 flex-1 truncate text-left text-[12px] font-medium leading-none text-[#EF6000]/80">
          {formatTrainOrderHoldBannerMessage(payHoldSecondsRemaining, actions)}
        </p>
      </div>
    </div>
  );
}
