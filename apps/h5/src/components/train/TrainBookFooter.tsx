import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";
import type { TrainBookBillBreakdown } from "@/lib/train-book";

import { TrainBookBillSheet } from "./TrainBookBillSheet";

interface TrainBookFooterProps {
  amount: number;
  disabled: boolean;
  pending: boolean;
  billOpen: boolean;
  billBreakdown: TrainBookBillBreakdown | null;
  showOfficialBook?: boolean;
  showDirectBook?: boolean;
  onBillToggle: () => void;
  onOfficialBook?: () => void;
  onDirectBook?: () => void;
}

function BillChevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 12 8"
      className={`h-2 w-3 shrink-0 text-[#2768FA] transition-transform duration-200 ${open ? "" : "rotate-180"}`}
      aria-hidden
    >
      <path
        d="M1 1.5 6 6.5 11 1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TrainBookFooter({
  amount,
  disabled,
  pending,
  billOpen,
  billBreakdown,
  showOfficialBook = true,
  showDirectBook = true,
  onBillToggle,
  onOfficialBook,
  onDirectBook,
}: TrainBookFooterProps) {
  const submitDisabled = disabled || pending;

  return (
    <>
      {billOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-black/25"
          aria-label="关闭费用明细"
          onClick={onBillToggle}
        />
      ) : null}

      <div
        className={`fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-lg flex-col ${HOTEL_DETAIL_FONT}`}
      >
        {billOpen && billBreakdown ? <TrainBookBillSheet breakdown={billBreakdown} /> : null}

        <div className="bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 min-w-0 flex-1 items-center gap-2">
              <p className="m-0 shrink-0 text-[13px] leading-none text-[#666666]">总计</p>
              <p className="m-0 text-[25px] font-semibold leading-none text-[#FF4D4F]">
                ¥{Number.isFinite(amount) ? amount : "—"}
              </p>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-[13px] leading-none text-[#2768FA]"
                aria-expanded={billOpen}
                onClick={onBillToggle}
              >
                明细
                <BillChevron open={billOpen} />
              </button>
            </div>

            {showOfficialBook ? (
              <button
                type="button"
                disabled={submitDisabled}
                onClick={onOfficialBook}
                className="h-10 min-w-[96px] shrink-0 rounded-full bg-[#5099fe] px-4 text-[14px] font-medium text-white disabled:opacity-50"
              >
                {pending ? "提交中…" : "12306预定"}
              </button>
            ) : null}

            {showDirectBook ? (
              <button
                type="button"
                disabled={submitDisabled}
                onClick={onDirectBook}
                className="h-10 min-w-[96px] shrink-0 rounded-full bg-[#2768FA] px-4 text-[14px] font-medium text-white disabled:opacity-50"
              >
                {pending ? "提交中…" : "生成订单"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
