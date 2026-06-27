import type { HotelOrderActionFlags } from "@ryx/shared-types";

import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";
import { shouldShowFooter } from "@/lib/hotel-order-detail";

interface HotelOrderDetailFooterProps {
  actions: HotelOrderActionFlags;
  pending?: boolean;
  onCancel: () => void;
  onPay: () => void;
}

export function HotelOrderDetailFooter({
  actions,
  pending = false,
  onCancel,
  onPay,
}: HotelOrderDetailFooterProps) {
  if (!shouldShowFooter(actions)) {
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
          className="flex h-11 flex-1 items-center justify-center rounded-[24px] border border-brand-primary bg-white text-[15px] font-medium text-brand-primary disabled:opacity-50"
        >
          取消
        </button>
      ) : null}
      {actions.showPay ? (
        <button
          type="button"
          disabled={pending}
          onClick={onPay}
          className="flex h-11 flex-1 items-center justify-center rounded-[24px] bg-[linear-gradient(270deg,var(--brand-btn-end)_0%,var(--brand-btn-start)_100%)] text-[15px] font-medium text-white disabled:opacity-50"
        >
          立即支付
        </button>
      ) : null}
    </div>
  );
}
