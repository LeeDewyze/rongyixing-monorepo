import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@ryx/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ryx/ui/components/ui/card";

import { useOrderDetail, useOrderPays, usePayCreate } from "@/hooks/useHotelBook";

export function HotelPayPage() {
  const { orderId = "" } = useParams();
  const navigate = useNavigate();
  const { data: order } = useOrderDetail(orderId, 0);
  const { data: pays, isLoading } = useOrderPays(orderId);
  const payCreate = usePayCreate();
  const [selected, setSelected] = useState<string>("");

  async function handlePay() {
    if (!selected) return;
    await payCreate.mutateAsync({
      OrderId: orderId,
      PayType: selected,
      Amount: order?.TotalAmount,
    });
    navigate("/home", { replace: true });
  }

  if (isLoading) return <p className="p-4 text-muted-foreground">加载支付方式…</p>;

  const channels = pays ?? [];

  return (
    <div className="space-y-4 p-4 pb-24">
      <h1 className="text-xl font-bold">选择支付方式</h1>
      <p className="text-lg font-semibold">应付 ¥{order?.TotalAmount ?? "-"}</p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">支付渠道</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {channels.map((ch) => (
            <label
              key={ch.PayType}
              className="flex cursor-pointer items-center gap-3 rounded-md border p-3"
            >
              <input
                type="radio"
                name="payType"
                value={ch.PayType}
                checked={selected === ch.PayType}
                onChange={() => setSelected(ch.PayType)}
              />
              <span>{ch.PayTypeName}</span>
            </label>
          ))}
        </CardContent>
      </Card>

      {payCreate.error ? (
        <p className="text-sm text-destructive">
          {payCreate.error instanceof Error ? payCreate.error.message : "支付失败"}
        </p>
      ) : null}

      <Button
        className="fixed bottom-4 left-4 right-4"
        disabled={!selected || payCreate.isPending}
        onClick={() => void handlePay()}
      >
        {payCreate.isPending ? "处理中…" : "确认支付"}
      </Button>
    </div>
  );
}
