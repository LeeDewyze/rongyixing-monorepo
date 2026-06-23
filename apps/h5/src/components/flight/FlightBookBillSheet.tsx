interface FlightBookBillSheetProps {
  open: boolean;
  unitPrice: number;
  passengerCount: number;
  onClose: () => void;
}

export function FlightBookBillSheet({
  open,
  unitPrice,
  passengerCount,
  onClose,
}: FlightBookBillSheetProps) {
  if (!open) return null;

  const total = unitPrice * passengerCount;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40">
      <button type="button" className="flex-1" aria-label="关闭" onClick={onClose} />
      <div className="rounded-t-2xl bg-white pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between border-b border-[#eeeeee] px-4 py-3">
          <p className="text-[16px] font-semibold text-[#333333]">账单明细</p>
          <button
            type="button"
            className="text-[22px] leading-none text-[#999999]"
            aria-label="关闭"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="space-y-3 px-4 py-4 text-[14px]">
          <div className="flex items-center justify-between text-[#666666]">
            <span>机票</span>
            <span>
              ¥{unitPrice} × {passengerCount}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-[#f0f0f0] pt-3 font-medium text-[#333333]">
            <span>合计</span>
            <span className="text-[#ff4d4f]">¥{total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
