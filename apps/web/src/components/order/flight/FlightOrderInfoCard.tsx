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
import {
  formatOrderDateTime,
  formatPayHoldCountdownZh,
  formatTravelPayType,
} from "@/lib/flight-order-detail";

interface FlightOrderInfoCardProps {
  detail: HotelOrderDetail;
  transactionId?: string;
  payHoldSecondsRemaining: number | null;
  onShowBill: () => void;
}

export function FlightOrderInfoCard({
  detail,
  transactionId,
  payHoldSecondsRemaining,
  onShowBill,
}: FlightOrderInfoCardProps) {
  const showCountdown =
    payHoldSecondsRemaining != null &&
    payHoldSecondsRemaining > 0 &&
    (detail.Actions?.showPay || detail.Actions?.showCancel);

  return (
    <section
      className={`overflow-hidden rounded-xl bg-white px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${HOTEL_DETAIL_FONT}`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <h2 className={HOTEL_ORDER_SECTION_TITLE}>订单信息</h2>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {showCountdown ? (
            <span className="text-[12px] font-medium leading-none text-[#FF383C]">
              支付剩余{formatPayHoldCountdownZh(payHoldSecondsRemaining)}
            </span>
          ) : null}
          {detail.StatusName ? (
            <OrderStatusBadge label={detail.StatusName} variant="order" />
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <OrderDetailInsetCell label="订单编号" value={detail.OrderNumber ?? detail.OrderId} />
        {transactionId ? <OrderDetailInsetCell label="事务号" value={transactionId} /> : null}
        <OrderDetailInsetCell label="付款方式" value={formatTravelPayType(detail.TravelPayType)} />
        <OrderDetailInsetCell label="完成时间" value={formatOrderDateTime(detail.InsertTime)} />
        <div className={ORDER_DETAIL_INSET_CELL_CLASS}>
          <span className={ORDER_DETAIL_INSET_LABEL_CLASS}>订单金额</span>
          <span className="flex shrink-0 items-center gap-2">
            <span className={HOTEL_ORDER_AMOUNT_VALUE}>¥{detail.TotalAmount ?? "—"}</span>
            <button type="button" className={HOTEL_ORDER_LINK_ACTION} onClick={onShowBill}>
              应付明细
            </button>
          </span>
        </div>
      </div>
    </section>
  );
}
