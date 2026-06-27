import { Link, useParams } from "react-router-dom";

import { usePageHeader } from "@/components/layout";
import { useOrderDetail } from "@/hooks/useHotelBook";
import { formatApiError } from "@/lib/formatApiError";

interface OrderFlightDetailViewProps {
  orderId: string;
}

export function OrderFlightDetailView({ orderId }: OrderFlightDetailViewProps) {
  const { data, isLoading, error } = useOrderDetail(orderId, 0);

  if (isLoading && !data) {
    return <p className="p-4 text-sm text-[#9CA3AF]">加载订单详情…</p>;
  }

  if (error) {
    return <p className="p-4 text-sm text-[#FF4D4F]">{formatApiError(error)}</p>;
  }

  if (!data) {
    return <p className="p-4 text-sm text-[#9CA3AF]">订单不存在</p>;
  }

  return (
    <div className="space-y-4 p-4 pb-24">
      <section className="rounded-lg bg-white p-4">
        <h2 className="text-base font-semibold text-brand-title">
          {data.RouteTitle ?? "机票订单"}
        </h2>
        <dl className="mt-3 space-y-2 text-sm text-[#666666]">
          <div className="flex justify-between gap-3">
            <dt>订单号</dt>
            <dd className="text-right text-brand-title">{data.OrderNumber ?? data.OrderId}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>状态</dt>
            <dd className="text-right font-medium text-brand-title">
              {data.StatusName ?? data.Status ?? "-"}
            </dd>
          </div>
          {data.TicketStatusName ? (
            <div className="flex justify-between gap-3">
              <dt>客票状态</dt>
              <dd className="text-right text-brand-title">{data.TicketStatusName}</dd>
            </div>
          ) : null}
          {data.DepartTime ? (
            <div className="flex justify-between gap-3">
              <dt>起飞时间</dt>
              <dd className="text-right text-brand-title">{data.DepartTime}</dd>
            </div>
          ) : null}
          {data.PassengerNames ? (
            <div className="flex justify-between gap-3">
              <dt>旅客姓名</dt>
              <dd className="text-right text-brand-title">{data.PassengerNames}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-3">
            <dt>订单金额</dt>
            <dd className="text-right text-lg font-semibold text-[#FF383C]">
              ¥{data.TotalAmount ?? "-"}
            </dd>
          </div>
        </dl>
      </section>

      {data.isShowPayButton ? (
        <Link
          to={`/flight/pay/${orderId}`}
          className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] block rounded-full bg-brand-primary py-3 text-center text-base font-medium text-white"
        >
          去支付
        </Link>
      ) : null}
    </div>
  );
}

export function OrderFlightDetailPage() {
  const { orderId = "" } = useParams();
  usePageHeader({ title: "订单详情", showBack: true });
  return <OrderFlightDetailView orderId={orderId} />;
}
