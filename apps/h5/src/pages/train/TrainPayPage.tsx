import { useParams } from "react-router-dom";

import { OrderPayPage } from "@/pages/order/OrderPayPage";
import { useTrainOrderDetail } from "@/hooks/useTrainOrderDetail";

export function TrainPayPage() {
  const { orderId = "" } = useParams();
  const { data: order } = useTrainOrderDetail(orderId);

  return (
    <OrderPayPage
      title="火车票支付"
      orderId={orderId}
      successPath={`/orders/train/${orderId}`}
      subtitle={order?.RouteTitle}
    />
  );
}
