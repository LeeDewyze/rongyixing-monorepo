import type { HotelOrderActionFlags } from "@ryx/shared-types";

import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";
import { shouldShowTrainFooter } from "@/lib/train-order-detail";

interface TrainOrderDetailFooterProps {
  actions: HotelOrderActionFlags;
  payHoldSecondsRemaining: number | null;
  pending?: boolean;
  onCancel: () => void;
  onPay: () => void;
  onIssue: () => void;
  onRefund?: () => void;
  onExchange?: () => void;
}

export function TrainOrderDetailFooter({
  actions,
  payHoldSecondsRemaining,
  pending = false,
  onCancel,
  onPay,
  onIssue,
  onRefund,
  onExchange,
}: TrainOrderDetailFooterProps) {
  if (!shouldShowTrainFooter(actions, payHoldSecondsRemaining)) {
    return null;
  }

  const cancelLabel = actions.showIssue ? "取消订单" : "取消";
  const hasSecondaryRow = actions.showRefund || actions.showExchange;
  const hasPrimaryRow = actions.showCancel || actions.showPay || actions.showIssue;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-30 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] ${HOTEL_DETAIL_FONT}`}
    >
      {hasSecondaryRow ? (
        <div className="mb-2 flex gap-3">
          {actions.showRefund ? (
            <button
              type="button"
              disabled={pending}
              onClick={onRefund}
              className="flex h-10 flex-1 items-center justify-center rounded-[24px] border border-[#2768FA] bg-white text-[14px] font-medium text-[#2768FA] disabled:opacity-50"
            >
              退票
            </button>
          ) : null}
          {actions.showExchange ? (
            <button
              type="button"
              disabled={pending}
              onClick={onExchange}
              className="flex h-10 flex-1 items-center justify-center rounded-[24px] border border-[#2768FA] bg-white text-[14px] font-medium text-[#2768FA] disabled:opacity-50"
            >
              改签
            </button>
          ) : null}
        </div>
      ) : null}

      {hasPrimaryRow ? (
        <div className="flex gap-3">
          {actions.showCancel ? (
            <button
              type="button"
              disabled={pending}
              onClick={onCancel}
              className="flex h-11 flex-1 items-center justify-center rounded-[24px] border border-[#2768FA] bg-white text-[15px] font-medium text-[#2768FA] disabled:opacity-50"
            >
              {cancelLabel}
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
          {actions.showIssue && !actions.showPay ? (
            <button
              type="button"
              disabled={pending}
              onClick={onIssue}
              className="flex h-11 flex-1 items-center justify-center rounded-[24px] bg-[linear-gradient(270deg,#2768FA_0%,#33A1F9_100%)] text-[15px] font-medium text-white disabled:opacity-50"
            >
              确认出票
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
