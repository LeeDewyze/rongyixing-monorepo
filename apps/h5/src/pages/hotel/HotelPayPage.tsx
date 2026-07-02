import { useParams } from "react-router-dom";

import { OrderPayPage } from "@/pages/order/OrderPayPage";

export function HotelPayPage() {
  const { orderId = "" } = useParams();

  return (
    <OrderPayPage
      title="订单支付"
      orderId={orderId}
      productType="Hotel"
      successPath={`/hotel/result/${orderId}`}
    />
  );
}
