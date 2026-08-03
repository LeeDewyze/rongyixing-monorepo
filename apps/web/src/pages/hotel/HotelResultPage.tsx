import { Link, useParams } from "react-router-dom";
import { Button } from "@ryx/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ryx/ui/components/ui/card";

import { useOrderDetail } from "@/hooks/useHotelBook";
import { usePageHeader } from "@/components/layout";

export function HotelResultPage() {
  const { orderId = "" } = useParams();
  const { data, isLoading, error } = useOrderDetail(orderId);

  usePageHeader({ title: "订单结果", showBack: true });

  if (isLoading && !data) {
    return <p className="p-4 text-muted-foreground">订单确认中…</p>;
  }

  if (error) {
    return (
      <p className="p-4 text-destructive">
        {error instanceof Error ? error.message : "加载失败"}
      </p>
    );
  }

  if (!data) return <p className="p-4">订单不存在</p>;

  return (
    <div className="space-y-4 p-4 pb-24">

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{data.HotelName ?? "酒店订单"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>订单号：{data.OrderNumber ?? data.OrderId}</p>
          <p>
            状态：
            <span className="font-medium">{data.StatusName ?? data.Status}</span>
          </p>
          <p>
            入住：{data.CheckInDate} → {data.CheckOutDate}
          </p>
          <p className="text-lg font-semibold">¥{data.TotalAmount ?? "-"}</p>
        </CardContent>
      </Card>

      {data.isShowPayButton ? (
        <Button asChild className="fixed bottom-4 left-4 right-4">
          <Link to={`/hotel/pay/${orderId}`}>去支付</Link>
        </Button>
      ) : (
        <p className="text-center text-sm text-muted-foreground">正在确认订单，请稍候…</p>
      )}
    </div>
  );
}
