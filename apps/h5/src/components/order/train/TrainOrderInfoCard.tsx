import type { HotelOrderDetail } from "@ryx/shared-types";

import {
  HOTEL_DETAIL_FONT,
  HOTEL_ORDER_AMOUNT_VALUE,
  HOTEL_ORDER_LINK_ACTION,
  HOTEL_ORDER_ROW_LABEL,
  HOTEL_ORDER_SECTION_TITLE,
} from "@/components/hotel/hotel-detail-chrome";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import {
  formatOrderDateTime,
  formatTravelPayType,
} from "@/lib/train-order-detail";

import { HotelOrderDetailRow } from "../hotel/HotelOrderDetailRow";

interface TrainOrderInfoCardProps {
  detail: HotelOrderDetail;
  transactionId?: string;
  outNumbers?: string;
  onShowBill: () => void;
}

export function TrainOrderInfoCard({
  detail,
  transactionId,
  outNumbers,
  onShowBill,
}: TrainOrderInfoCardProps) {
  return (
    <section
      className={`overflow-hidden rounded-xl bg-white px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${HOTEL_DETAIL_FONT}`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <h2 className={HOTEL_ORDER_SECTION_TITLE}>订单信息</h2>
        {detail.StatusName ? (
          <OrderStatusBadge label={detail.StatusName} variant="order" />
        ) : null}
      </div>

      <HotelOrderDetailRow label="订单编号" value={detail.OrderNumber ?? detail.OrderId} />
      {transactionId ? <HotelOrderDetailRow label="事务号" value={transactionId} /> : null}
      <HotelOrderDetailRow label="外部编号" value={outNumbers?.trim() ?? ""} />
      <HotelOrderDetailRow label="付款方式" value={formatTravelPayType(detail.TravelPayType)} />
      <HotelOrderDetailRow label="出票时间" value={formatOrderDateTime(detail.InsertTime)} />
      <div className="flex items-center justify-between gap-4 py-1.5">
        <span className={HOTEL_ORDER_ROW_LABEL}>订单金额</span>
        <span className="flex items-center gap-2">
          <span className={HOTEL_ORDER_AMOUNT_VALUE}>¥{detail.TotalAmount ?? "—"}</span>
          <button type="button" className={HOTEL_ORDER_LINK_ACTION} onClick={onShowBill}>
            应付明细
          </button>
        </span>
      </div>
    </section>
  );
}
