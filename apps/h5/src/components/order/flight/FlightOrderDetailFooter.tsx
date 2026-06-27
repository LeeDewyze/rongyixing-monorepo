import type { HotelOrderActionFlags } from "@ryx/shared-types";

import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";
import { shouldShowFlightFooter } from "@/lib/flight-order-detail";

interface FlightOrderDetailFooterProps {
  actions: HotelOrderActionFlags;
  payHoldSecondsRemaining: number | null;
  pending?: boolean;
  onCancel: () => void;
  onPay: () => void;
}

export function FlightOrderDetailFooter({
  actions,
  payHoldSecondsRemaining,
  pending = false,
  onCancel,
  onPay,
}: FlightOrderDetailFooterProps) {
  if (!shouldShowFlightFooter(actions, payHoldSecondsRemaining)) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-30 flex gap-3 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] ${HOTEL_DETAIL_FONT}`}
    >
      {actions.showCancel ? (
        <button
          type="button"
          disabled={pending}
          onClick={onCancel}
          className="flex h-11 flex-1 items-center justify-center rounded-[24px] border border-[#2768FA] bg-white text-[15px] font-medium text-[#2768FA] disabled:opacity-50"
        >
          取消
        </button>
      ) : null}
      {actions.showPay ? (
        <button
          type="button"
          disabled={pending}
          onClick={onPay}
          className="flex h-11 flex-1 items-center justify-center rounded-[24px] bg-[linear-gradient(270deg,#2768FA_0%,#33A1F9_100%)] text-[15px] font-medium text-white disabled:opacity-50"
        >
          立即支付
        </button>
      ) : null}
    </div>
  );
}
