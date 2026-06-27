import type { FlightBookBillBreakdown } from "@/lib/flight-book";

import { FlightBookBillSheet } from "@/components/flight/FlightBookBillSheet";
import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";

interface FlightBookFooterProps {
  amount: number;
  agreed: boolean;
  disabled: boolean;
  pending: boolean;
  pendingLabel?: string;
  showTicketNotice?: boolean;
  showSaveOrder?: boolean;
  billOpen: boolean;
  billBreakdown: FlightBookBillBreakdown | null;
  onAgreedChange: (agreed: boolean) => void;
  onBillToggle: () => void;
  onShowTicketNotice?: () => void;
  onSubmit: () => void;
  onSave?: () => void;
}

function BillChevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 12 8"
      className={`h-2 w-3 shrink-0 text-brand-primary transition-transform duration-200 ${open ? "" : "rotate-180"}`}
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

export function FlightBookFooter({
  amount,
  agreed,
  disabled,
  pending,
  pendingLabel,
  showTicketNotice = false,
  showSaveOrder = false,
  billOpen,
  billBreakdown,
  onAgreedChange,
  onBillToggle,
  onShowTicketNotice,
  onSubmit,
  onSave,
}: FlightBookFooterProps) {
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

      <div className={`fixed inset-x-0 bottom-0 z-30 flex flex-col ${HOTEL_DETAIL_FONT}`}>
        {billOpen && billBreakdown ? <FlightBookBillSheet breakdown={billBreakdown} /> : null}

        <div className="bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
          <label className="mb-2.5 flex cursor-pointer items-center gap-2 text-[12px] leading-snug text-[#666666]">
            <span className="relative flex size-5 shrink-0 items-center justify-center">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => onAgreedChange(e.target.checked)}
                className="peer absolute inset-0 opacity-0"
              />
              <span className="size-5 rounded-full border border-[#b8b8b8] peer-checked:border-brand-accent peer-checked:bg-brand-accent" />
              <span className="pointer-events-none absolute hidden text-[13px] leading-none text-white peer-checked:block">
                ✓
              </span>
            </span>
            <span>
              我已阅读并同意
              {showTicketNotice ? (
                <button
                  type="button"
                  className="text-brand-accent"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onShowTicketNotice?.();
                  }}
                >
                  购票须知
                </button>
              ) : (
                <span className="text-brand-accent">购票须知</span>
              )}
            </span>
          </label>

          <div className="flex items-center gap-3">
            <div className="flex h-9 min-w-0 flex-1 items-center gap-2">
              <p className="m-0 shrink-0 text-[13px] leading-none text-[#666666]">总计</p>
              <p className="m-0 text-[25px] font-semibold leading-none text-[#FF4D4F]">
                ¥{Number.isFinite(amount) ? amount : "—"}
              </p>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-[13px] leading-none text-brand-primary"
                aria-expanded={billOpen}
                onClick={onBillToggle}
              >
                明细
                <BillChevron open={billOpen} />
              </button>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {showSaveOrder ? (
                <button
                  type="button"
                  disabled={disabled || !agreed}
                  className="flex h-9 items-center justify-center rounded-[24px] border border-brand-primary px-4 text-[14px] leading-none text-brand-primary disabled:border-[#CCCCCC] disabled:text-[#CCCCCC]"
                  onClick={onSave}
                >
                  保存订单
                </button>
              ) : null}
              <button
                type="button"
                disabled={disabled || !agreed}
                className="flex h-9 w-[120px] shrink-0 items-center justify-center rounded-[24px] bg-[linear-gradient(270deg,var(--brand-btn-end)_0%,var(--brand-btn-start)_100%)] text-[14px] font-medium leading-none text-white disabled:bg-none disabled:bg-[#CCCCCC] active:opacity-90"
                onClick={onSubmit}
              >
                {pending ? (pendingLabel ?? "提交中…") : "生成订单"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
