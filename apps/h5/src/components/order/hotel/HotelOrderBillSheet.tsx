import type { HotelOrderBillLine } from "@ryx/shared-types";

import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";
import { sumBillLines } from "@/lib/hotel-order-detail";

interface HotelOrderBillSheetProps {
  open: boolean;
  lines: HotelOrderBillLine[];
  onClose: () => void;
}

export function HotelOrderBillSheet({ open, lines, onClose }: HotelOrderBillSheetProps) {
  if (!open) return null;

  const total = sumBillLines(lines);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-end bg-black/40 ${HOTEL_DETAIL_FONT}`}
    >
      <button type="button" className="flex-1" aria-label="关闭" onClick={onClose} />
      <div className="max-h-[70vh] overflow-y-auto rounded-t-2xl bg-white pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="sticky top-0 flex items-center justify-between border-b border-[#EEEEEE] bg-white px-4 py-3">
          <p className="text-[16px] font-semibold text-[#333333]">房费明细</p>
          <button
            type="button"
            className="text-[22px] leading-none text-[#999999]"
            aria-label="关闭"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="space-y-3 px-4 py-4">
          {lines.length === 0 ? (
            <p className="py-6 text-center text-[14px] text-[#999999]">暂无明细</p>
          ) : (
            lines.map((line, index) => (
              <div
                key={`${line.Name}-${index}`}
                className="flex items-center justify-between text-[14px] text-[#333333]"
              >
                <span className="min-w-0 flex-1 pr-3">{line.Name}</span>
                <span>¥{line.Amount}</span>
              </div>
            ))
          )}

          {lines.length > 0 ? (
            <div className="flex items-center justify-between border-t border-[#F0F0F0] pt-3 text-[15px] font-medium text-[#333333]">
              <span>总计</span>
              <span className="text-[18px] text-[#FF4D4F]">¥{total}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
