interface FlightBookFooterProps {
  amount: number;
  agreed: boolean;
  disabled: boolean;
  pending: boolean;
  onAgreedChange: (agreed: boolean) => void;
  onShowBill: () => void;
  onSubmit: () => void;
}

export function FlightBookFooter({
  amount,
  agreed,
  disabled,
  pending,
  onAgreedChange,
  onShowBill,
  onSubmit,
}: FlightBookFooterProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white px-4 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
      <label className="mb-2.5 flex cursor-pointer items-center gap-2 text-[12px] leading-snug text-[#666666]">
        <span className="relative flex size-5 shrink-0 items-center justify-center">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => onAgreedChange(e.target.checked)}
            className="peer absolute inset-0 opacity-0"
          />
          <span className="size-5 rounded-full border border-[#b8b8b8] peer-checked:border-[#5099fe] peer-checked:bg-[#5099fe]" />
          <span className="pointer-events-none absolute hidden text-[13px] leading-none text-white peer-checked:block">
            ✓
          </span>
        </span>
        <span>
          我已阅读并同意
          <span className="text-[#5099fe]">购票须知</span>
        </span>
      </label>

      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 items-end gap-3">
          <p className="text-[25px] font-semibold leading-none text-[#ff4d4f]">
            ¥{Number.isFinite(amount) ? amount : "—"}
          </p>
          <button
            type="button"
            className="pb-0.5 text-[13px] text-[#5099fe]"
            onClick={onShowBill}
          >
            明细
          </button>
        </div>

        <button
          type="button"
          disabled={disabled || !agreed}
          className="min-w-[9rem] rounded-full bg-[linear-gradient(90deg,#24a8ff_0%,#2468f7_100%)] px-6 py-3 text-[15px] font-medium text-white shadow-[0_6px_14px_rgba(36,104,247,0.24)] disabled:bg-none disabled:bg-[#cccccc] disabled:shadow-none active:opacity-90"
          onClick={onSubmit}
        >
          {pending ? "提交中…" : "生成订单"}
        </button>
      </div>
    </div>
  );
}
