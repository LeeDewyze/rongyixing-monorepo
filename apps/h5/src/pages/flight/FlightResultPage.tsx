import { Link, useLocation, useParams } from "react-router-dom";
import { Button } from "@ryx/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ryx/ui/components/ui/card";

import { usePageHeader } from "@/components/layout";
import { useOrderDetail } from "@/hooks/useHotelBook";
import { formatApiError } from "@/lib/formatApiError";
import { resolveCheckoutSuccessMessage } from "@/lib/order-pay";

interface FlightResultLocationState {
  paySucceeded?: boolean;
  message?: string;
}

export function FlightResultPage() {
  const { orderId = "" } = useParams();
  const location = useLocation();
  const state = (location.state ?? {}) as FlightResultLocationState;
  const { data, isLoading, error } = useOrderDetail(orderId);

  usePageHeader({ title: "订单结果", showBack: true });

  if (isLoading && !data) {
    return <p className="p-4 text-muted-foreground">订单确认中…</p>;
  }

  if (error) {
    return <p className="p-4 text-destructive">{formatApiError(error)}</p>;
  }

  if (!data) return <p className="p-4">订单不存在</p>;

  const tipMessage =
    state.message ??
    resolveCheckoutSuccessMessage({
      needsPay: Boolean(data.isShowPayButton),
      paySucceeded: state.paySucceeded,
    });

  return (
    <div className="space-y-4 p-4 pb-24">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{data.RouteTitle ?? "机票订单"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">{tipMessage}</p>
          <p>订单号：{data.OrderNumber ?? data.OrderId}</p>
          <p>
            状态：
            <span className="font-medium">{data.StatusName ?? data.Status}</span>
          </p>
          {data.DepartTime ? <p>起飞：{data.DepartTime}</p> : null}
          {data.PassengerNames ? <p>旅客：{data.PassengerNames}</p> : null}
          <p className="text-lg font-semibold">¥{data.TotalAmount ?? "-"}</p>
        </CardContent>
      </Card>

      {data.isShowPayButton ? (
        <Button asChild className="fixed bottom-4 left-4 right-4">
          <Link to={`/flight/pay/${orderId}`}>去支付</Link>
        </Button>
      ) : (
        <Button asChild variant="outline" className="fixed bottom-4 left-4 right-4">
          <Link to={`/orders/flight/${orderId}`}>查看订单详情</Link>
        </Button>
      )}
    </div>
  );
}
