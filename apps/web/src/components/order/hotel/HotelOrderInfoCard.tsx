import type { HotelOrderDetail } from "@ryx/shared-types";

import {
  HOTEL_DETAIL_FONT,
  HOTEL_ORDER_AMOUNT_VALUE,
  HOTEL_ORDER_LINK_ACTION,
  HOTEL_ORDER_SECTION_TITLE,
} from "@/components/hotel/hotel-detail-chrome";
import {
  ORDER_DETAIL_INSET_CELL_CLASS,
  ORDER_DETAIL_INSET_LABEL_CLASS,
  OrderDetailInsetCell,
} from "@/components/order/OrderDetailInsetCell";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { formatOrderDateTime, formatTravelPayType } from "@/lib/hotel-order-detail";

interface HotelOrderInfoCardProps {
  detail: HotelOrderDetail;
  transactionId?: string;
  onShowBill: () => void;
}

export function HotelOrderInfoCard({ detail, transactionId, onShowBill }: HotelOrderInfoCardProps) {
  const selfPayAmount = detail.SelfPayAmount ?? 0;

  return (
    <section
      className={`overflow-hidden rounded-xl bg-white px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${HOTEL_DETAIL_FONT}`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className={HOTEL_ORDER_SECTION_TITLE}>订单信息</h2>
        {detail.StatusName ? <OrderStatusBadge label={detail.StatusName} variant="order" /> : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <OrderDetailInsetCell label="订单编号" value={detail.OrderNumber ?? detail.OrderId} />
        {transactionId ? <OrderDetailInsetCell label="事务号" value={transactionId} /> : null}
        <OrderDetailInsetCell label="付款方式" value={formatTravelPayType(detail.TravelPayType)} />
        <OrderDetailInsetCell label="出票时间" value={formatOrderDateTime(detail.InsertTime)} />
        <div className={ORDER_DETAIL_INSET_CELL_CLASS}>
          <span className={ORDER_DETAIL_INSET_LABEL_CLASS}>订单金额</span>
          <span className="flex shrink-0 items-center gap-2">
            <span className={HOTEL_ORDER_AMOUNT_VALUE}>¥{detail.TotalAmount ?? "—"}</span>
            <button type="button" className={HOTEL_ORDER_LINK_ACTION} onClick={onShowBill}>
              账单明细
            </button>
          </span>
        </div>
        <OrderDetailInsetCell
          label="个人支付"
          value={`¥${selfPayAmount}`}
          valueClassName={selfPayAmount > 0 ? "text-[#FF0000]" : ""}
        />
      </div>
    </section>
  );
}
