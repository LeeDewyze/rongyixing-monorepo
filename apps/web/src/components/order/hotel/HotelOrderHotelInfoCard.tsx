import type { HotelOrderRoom } from "@ryx/shared-types";

import {
  HOTEL_DETAIL_FONT,
  HOTEL_ORDER_SECTION_TITLE,
} from "@/components/hotel/hotel-detail-chrome";
import { OrderDetailInsetCell } from "@/components/order/OrderDetailInsetCell";
import {
  computeStayNights,
  formatActualStayRange,
  formatHotelPaymentType,
  formatOrderBreakfastLabel,
  formatStayRange,
} from "@/lib/hotel-order-detail";

interface HotelOrderHotelInfoCardProps {
  room: HotelOrderRoom;
}

export function HotelOrderHotelInfoCard({ room }: HotelOrderHotelInfoCardProps) {
  const nights = computeStayNights(room.BeginDate, room.EndDate);
  const breakfastLabel = formatOrderBreakfastLabel(room.Breakfast);
  const roomNameWithBreakfast = room.RoomName
    ? [room.RoomName, breakfastLabel].filter(Boolean).join(" ")
    : null;

  return (
    <section
      className={`overflow-hidden rounded-xl bg-white px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${HOTEL_DETAIL_FONT}`}
    >
      <h2 className={`mb-3 ${HOTEL_ORDER_SECTION_TITLE}`}>酒店信息</h2>

      <div className="grid grid-cols-2 gap-3">
        <OrderDetailInsetCell label="酒店名称" value={room.HotelName ?? "—"} multilineValue />
        <OrderDetailInsetCell
          label="房型名称"
          value={roomNameWithBreakfast ?? "—"}
          multilineValue
        />
        <OrderDetailInsetCell
          label="酒店状态"
          value={
            <>
              {room.StatusName ?? "—"}
              {room.ExceptionMessage ? (
                <span className="text-[#FF4D4F]"> ({room.ExceptionMessage})</span>
              ) : null}
            </>
          }
          multilineValue
        />
        <OrderDetailInsetCell
          label="入离日期"
          value={formatStayRange(room.BeginDate, room.EndDate, nights)}
          multilineValue
        />
        <OrderDetailInsetCell
          label="实际入离"
          value={formatActualStayRange(room.CheckinTime, room.CheckoutTime)}
          multilineValue
        />
        <OrderDetailInsetCell label="地址" value={room.HotelAddress ?? "—"} multilineValue />
        <OrderDetailInsetCell label="支付方式" value={formatHotelPaymentType(room.PaymentType)} />
        <OrderDetailInsetCell
          label="支付金额"
          value={room.RoomFee != null ? `¥${room.RoomFee}` : "—"}
        />
        <OrderDetailInsetCell label="发票类型" value={room.HotelInvoice ?? "—"} />
        <OrderDetailInsetCell
          label="酒店电话"
          value={
            room.HotelContact ? (
              <a href={`tel:${room.HotelContact}`} className="text-brand-primary">
                {room.HotelContact}
              </a>
            ) : (
              "—"
            )
          }
        />
        <OrderDetailInsetCell label="供应商" value={room.SupplierName ?? "—"} />
      </div>

      {room.RuleDescription ? (
        <div className="mt-3 border-t border-[#F0F0F0] pt-2">
          <p className="pb-2 text-[13px] leading-relaxed text-[#FF9500]">{room.RuleDescription}</p>
        </div>
      ) : null}
    </section>
  );
}
