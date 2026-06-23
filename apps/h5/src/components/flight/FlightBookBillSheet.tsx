import type { FlightBookBillBreakdown } from "@/lib/flight-book";

interface FlightBookBillSheetProps {
  open: boolean;
  breakdown: FlightBookBillBreakdown | null;
  onClose: () => void;
}

export function FlightBookBillSheet({ open, breakdown, onClose }: FlightBookBillSheetProps) {
  if (!open || !breakdown) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40">
      <button type="button" className="flex-1" aria-label="关闭" onClick={onClose} />
      <div className="max-h-[70vh] overflow-y-auto rounded-t-2xl bg-white pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="sticky top-0 flex items-center justify-between border-b border-[#eeeeee] bg-white px-4 py-3">
          <p className="text-[16px] font-semibold text-[#333333]">费用明细</p>
          <button
            type="button"
            className="text-[22px] leading-none text-[#999999]"
            aria-label="关闭"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="space-y-4 px-4 py-4">
          {breakdown.passengers.map((bill, index) => (
            <div
              key={`${bill.passengerName}-${bill.credentialNumber}-${index}`}
              className="space-y-2.5 text-[14px]"
            >
              <p className="text-[15px] font-medium text-[#333333]">
                {bill.passengerName}
                {bill.credentialNumber ? `(${bill.credentialNumber})` : ""}
              </p>

              <div className="flex items-center justify-between text-[#5099fe]">
                <span>{bill.fromCity}</span>
                <span>{bill.toCity}</span>
              </div>

              <div className="flex items-center justify-between text-[#333333]">
                <span>机票票价</span>
                <span>{bill.ticketPrice}元</span>
              </div>

              {bill.flightRouteLabel ? (
                <p className="text-[13px] text-[#666666]">{bill.flightRouteLabel}</p>
              ) : null}

              {bill.taxLines.map((line) => (
                <div
                  key={`${bill.passengerName}-${line.name}`}
                  className="flex items-center justify-between text-[#333333]"
                >
                  <span>{line.name}</span>
                  <span>{line.amount}元</span>
                </div>
              ))}

              {bill.serviceFee > 0 ? (
                <div className="flex items-center justify-between text-[#333333]">
                  <span>服务费</span>
                  <span>{bill.serviceFee}元</span>
                </div>
              ) : null}

              {index < breakdown.passengers.length - 1 ? (
                <div className="border-b border-[#f0f0f0] pt-1" />
              ) : null}
            </div>
          ))}

          <div className="flex items-center justify-between border-t border-[#f0f0f0] pt-3 text-[15px] font-medium text-[#333333]">
            <span>总计</span>
            <span className="text-[18px] text-[#ff4d4f]">¥{breakdown.total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
