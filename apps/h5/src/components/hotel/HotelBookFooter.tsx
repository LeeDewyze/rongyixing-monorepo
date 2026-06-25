import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";

interface HotelBookFooterProps {
  amount: number;
  disabled: boolean;
  pending: boolean;
  onShowBill: () => void;
  onSubmit: () => void;
}

export function HotelBookFooter({
  amount,
  disabled,
  pending,
  onShowBill,
  onSubmit,
}: HotelBookFooterProps) {
  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-30 flex items-center bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] ${HOTEL_DETAIL_FONT}`}
    >
      <div className="flex w-full items-center gap-3">
        <div className="flex h-9 min-w-0 flex-1 items-center gap-3">
          <p className="m-0 text-[25px] font-semibold leading-none text-[#FF4D4F]">
            ¥{Number.isFinite(amount) ? amount : "—"}
          </p>
          <button type="button" className="text-[13px] leading-none text-[#2768FA]" onClick={onShowBill}>
            账单明细
          </button>
        </div>

        <button
          type="button"
          disabled={disabled}
          className="flex h-9 w-[120px] shrink-0 items-center justify-center rounded-[24px] bg-[linear-gradient(270deg,#2768FA_0%,#33A1F9_100%)] text-[14px] font-medium leading-none text-white disabled:bg-none disabled:bg-[#CCCCCC] active:opacity-90"
          onClick={onSubmit}
        >
          {pending ? "提交中…" : "生成订单"}
        </button>
      </div>
    </div>
  );
}
