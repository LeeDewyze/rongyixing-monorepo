import type { HotelOrderRoom } from "@ryx/shared-types";

import {
  HOTEL_DETAIL_FONT,
  HOTEL_ORDER_SECTION_TITLE,
} from "@/components/hotel/hotel-detail-chrome";
import {
  computeStayNights,
  formatActualStayRange,
  formatHotelPaymentType,
  formatOrderBreakfastLabel,
  formatStayRange,
} from "@/lib/hotel-order-detail";

import { HotelOrderDetailRow } from "./HotelOrderDetailRow";

interface HotelOrderHotelInfoCardProps {
  room: HotelOrderRoom;
}

export function HotelOrderHotelInfoCard({ room }: HotelOrderHotelInfoCardProps) {
  const nights = computeStayNights(room.BeginDate, room.EndDate);

  return (
    <section
      className={`overflow-hidden rounded-xl bg-white px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${HOTEL_DETAIL_FONT}`}
    >
      <h2 className={`mb-3 ${HOTEL_ORDER_SECTION_TITLE}`}>酒店信息</h2>

      <HotelOrderDetailRow label="酒店名称" value={room.HotelName ?? "—"} />
      <HotelOrderDetailRow
        label="房型名称"
        value={
          room.RoomName ? (
            <span className="flex max-h-[36px] w-full flex-col items-end overflow-hidden text-right leading-[18px]">
              <span className="line-clamp-1 w-full break-all">{room.RoomName}</span>
              <span className="shrink-0">{formatOrderBreakfastLabel(room.Breakfast)}</span>
            </span>
          ) : (
            "—"
          )
        }
      />
      <HotelOrderDetailRow label="酒店状态" value={room.StatusName ?? "—"} />
      {room.ExceptionMessage ? (
        <p className="py-1 text-right text-[13px] text-[#FF9500]">{room.ExceptionMessage}</p>
      ) : null}
      <HotelOrderDetailRow
        label="入离日期"
        value={formatStayRange(room.BeginDate, room.EndDate, nights)}
      />
      <HotelOrderDetailRow
        label="实际入离"
        value={formatActualStayRange(room.CheckinTime, room.CheckoutTime)}
      />
      <HotelOrderDetailRow label="地址" value={room.HotelAddress ?? "—"} />
      <HotelOrderDetailRow label="支付方式" value={formatHotelPaymentType(room.PaymentType)} />
      <HotelOrderDetailRow
        label="支付金额"
        value={room.RoomFee != null ? `¥${room.RoomFee}` : "—"}
      />
      <HotelOrderDetailRow label="发票类型" value={room.HotelInvoice ?? "—"} />
      <HotelOrderDetailRow
        label="酒店电话"
        value={
          room.HotelContact ? (
            <a href={`tel:${room.HotelContact}`} className="text-[#2768FA]">
              {room.HotelContact}
            </a>
          ) : (
            "—"
          )
        }
      />
      <HotelOrderDetailRow label="供应商" value={room.SupplierName ?? "—"} />

      {room.RuleDescription ? (
        <div className="border-t border-[#F0F0F0] pt-2">
          <p className="pb-2 text-[13px] leading-relaxed text-[#FF9500]">{room.RuleDescription}</p>
        </div>
      ) : null}
    </section>
  );
}
