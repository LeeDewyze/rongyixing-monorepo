import { OrderListPage } from "@/pages/order/OrderListPage";

/** Orders tab shell — maps to RYX `tmc-order-list` inside bottom navigation. */
export function OrdersTabPage() {
  return <OrderListPage embeddedInTab />;
}
