import { useParams } from "react-router-dom";

import { OrderPayPage } from "@/pages/order/OrderPayPage";
import { useOrderDetail } from "@/hooks/useHotelBook";

export function FlightPayPage() {
  const { orderId = "" } = useParams();
  const { data: order } = useOrderDetail(orderId, 0);

  return (
    <OrderPayPage
      title="机票支付"
      orderId={orderId}
      successPath={`/orders/flight/${orderId}`}
      subtitle={order?.RouteTitle}
    />
  );
}
