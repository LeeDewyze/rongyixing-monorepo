import { useParams, useSearchParams } from "react-router-dom";

import { OrderPayPage } from "@/pages/order/OrderPayPage";
import { useTrainOrderDetail } from "@/hooks/useTrainOrderDetail";

export function TrainPayPage() {
  const { orderId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const channel = searchParams.get("channel") === "tourist" ? "tourist" : undefined;
  const { data: order } = useTrainOrderDetail(orderId, channel);

  return (
    <OrderPayPage
      title="火车票支付"
      orderId={orderId}
      productType="Train"
      successPath={`/orders/train/${orderId}`}
      subtitle={order?.RouteTitle}
    />
  );
}
