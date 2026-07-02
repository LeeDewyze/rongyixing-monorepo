import { useParams, useSearchParams } from "react-router-dom";

import { OrderPayPage } from "@/pages/order/OrderPayPage";
import { useOrderDetail } from "@/hooks/useHotelBook";

export function FlightPayPage() {
  const { orderId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const channel = searchParams.get("channel") === "tourist" ? "tourist" : undefined;
  const { data: order } = useOrderDetail(orderId, 0, channel);

  return (
    <OrderPayPage
      title="机票支付"
      orderId={orderId}
      productType="Flight"
      successPath={`/orders/flight/${orderId}`}
      subtitle={order?.RouteTitle}
    />
  );
}
