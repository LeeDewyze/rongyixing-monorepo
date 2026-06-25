import type { HotelBillNight } from "@/lib/hotel-book";
import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";
import { formatHotelDateShort } from "@/lib/date-search";

interface HotelBookBillSheetProps {
  open: boolean;
  nights: HotelBillNight[];
  serviceFee: number;
  total: number;
  onClose: () => void;
}

export function HotelBookBillSheet({
  open,
  nights,
  serviceFee,
  total,
  onClose,
}: HotelBookBillSheetProps) {
  if (!open) return null;

  return (
    <div className={`fixed inset-0 z-50 flex flex-col justify-end bg-black/40 ${HOTEL_DETAIL_FONT}`}>
      <button type="button" className="flex-1" aria-label="关闭" onClick={onClose} />
      <div className="max-h-[70vh] overflow-y-auto rounded-t-2xl bg-white pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="sticky top-0 flex items-center justify-between border-b border-[#EEEEEE] bg-white px-4 py-3">
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

        <div className="space-y-3 px-4 py-4">
          {nights.map((night) => (
            <div
              key={night.date}
              className="flex items-center justify-between text-[14px] text-[#333333]"
            >
              <span>{formatHotelDateShort(night.date)}</span>
              <span>¥{night.price}</span>
            </div>
          ))}

          {serviceFee > 0 ? (
            <div className="flex items-center justify-between border-t border-[#F0F0F0] pt-3 text-[14px] text-[#333333]">
              <span>服务费</span>
              <span>¥{serviceFee}</span>
            </div>
          ) : null}

          <div className="flex items-center justify-between border-t border-[#F0F0F0] pt-3 text-[15px] font-medium text-[#333333]">
            <span>总计</span>
            <span className="text-[18px] text-[#FF4D4F]">¥{total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
