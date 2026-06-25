import type { HotelOrderDetail } from "@ryx/shared-types";

import {
  HOTEL_DETAIL_FONT,
  HOTEL_ORDER_AMOUNT_VALUE,
  HOTEL_ORDER_LINK_ACTION,
  HOTEL_ORDER_ROW_LABEL,
  HOTEL_ORDER_SECTION_TITLE,
} from "@/components/hotel/hotel-detail-chrome";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { formatOrderDateTime, formatTravelPayType } from "@/lib/hotel-order-detail";

import { HotelOrderDetailRow } from "./HotelOrderDetailRow";

interface HotelOrderInfoCardProps {
  detail: HotelOrderDetail;
  transactionId?: string;
  onShowBill: () => void;
}

export function HotelOrderInfoCard({ detail, transactionId, onShowBill }: HotelOrderInfoCardProps) {
  return (
    <section
      className={`overflow-hidden rounded-xl bg-white px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${HOTEL_DETAIL_FONT}`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className={HOTEL_ORDER_SECTION_TITLE}>订单信息</h2>
        {detail.StatusName ? <OrderStatusBadge label={detail.StatusName} variant="order" /> : null}
      </div>

      <HotelOrderDetailRow label="订单编号" value={detail.OrderNumber ?? detail.OrderId} />
      {transactionId ? <HotelOrderDetailRow label="事务号" value={transactionId} /> : null}
      <HotelOrderDetailRow label="付款方式" value={formatTravelPayType(detail.TravelPayType)} />
      <HotelOrderDetailRow label="出票时间" value={formatOrderDateTime(detail.InsertTime)} />
      <div className="flex items-center justify-between gap-4 py-1.5">
        <span className={HOTEL_ORDER_ROW_LABEL}>订单金额</span>
        <span className="flex items-center gap-2">
          <span className={HOTEL_ORDER_AMOUNT_VALUE}>¥{detail.TotalAmount ?? "—"}</span>
          <button type="button" className={HOTEL_ORDER_LINK_ACTION} onClick={onShowBill}>
            账单明细
          </button>
        </span>
      </div>
      <HotelOrderDetailRow
        label="个人支付"
        value={`¥${detail.SelfPayAmount ?? 0}`}
        valueClassName={(detail.SelfPayAmount ?? 0) > 0 ? "text-[#FF0000]" : ""}
      />
    </section>
  );
}
