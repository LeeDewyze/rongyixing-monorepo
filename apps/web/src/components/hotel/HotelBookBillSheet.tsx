import type { HotelBillNight } from "@/lib/hotel-book";
import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";

export interface HotelBookBillSheetProps {
  nights: HotelBillNight[];
  nightCount: number;
  roomSubtotal: number;
  serviceFee: number;
  roomCount: number;
}

function formatBillAmount(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return String(Math.round(value * 100) / 100);
}

export function HotelBookBillSheet({
  nights,
  nightCount,
  roomSubtotal,
  serviceFee,
  roomCount,
}: HotelBookBillSheetProps) {
  const quantityLabel = roomCount > 1 ? `${roomCount} x ` : "1 x ";

  return (
    <div
      className={`mx-3 mb-2 overflow-hidden rounded-2xl border border-white/80 bg-white/95 shadow-[0_8px_28px_rgba(15,23,42,0.14)] backdrop-blur-md ${HOTEL_DETAIL_FONT}`}
      role="dialog"
      aria-label="房费明细"
    >
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-[15px] font-medium text-brand-title">房费明细</p>
        <p className="text-[13px] text-[#666666]">
          <span>{nightCount}晚,共 </span>
          <span className="font-medium text-[#FF4D4F]">¥{formatBillAmount(roomSubtotal)}</span>
        </p>
      </div>

      <div className="space-y-2.5 px-4 pb-3">
        {nights.map((night) => (
          <div
            key={night.date}
            className="flex items-center justify-between text-[13px] leading-none text-[#999999]"
          >
            <span>{night.date}</span>
            <span>
              {quantityLabel}¥{formatBillAmount(night.price)}
            </span>
          </div>
        ))}
      </div>

      {serviceFee > 0 ? (
        <>
          <div className="mx-4 border-t border-dashed border-[#E5E7EB]" />
          <div className="flex items-center justify-between px-4 py-3 text-[14px] text-[#333333]">
            <span>服务费</span>
            <span className="font-medium">¥{formatBillAmount(serviceFee)}</span>
          </div>
        </>
      ) : null}
    </div>
  );
}
