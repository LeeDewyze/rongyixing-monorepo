import { useParams, useSearchParams } from "react-router-dom";

import { OrderPayPage } from "@/pages/order/OrderPayPage";

export function HotelPayPage() {
  const { orderId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const channel = searchParams.get("channel") === "tourist" ? "tourist" : undefined;

  return (
    <OrderPayPage
      title="订单支付"
      orderId={orderId}
      productType="Hotel"
      {...(channel ? { channel } : {})}
      successPath={`/hotel/result/${orderId}`}
    />
  );
}
