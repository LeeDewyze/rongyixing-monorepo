import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@ryx/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ryx/ui/components/ui/card";

import { usePageHeader } from "@/components/layout";
import {
  useOrderPays,
  usePayCreate,
  usePayHoldCountdown,
  usePayProcess,
  usePayTotalAmount,
} from "@/hooks/useOrderPay";
import { useOrderDetail } from "@/hooks/useHotelBook";
import {
  executeOrderPayFlow,
  formatPayHoldCountdown,
} from "@/lib/order-pay";

export interface OrderPayPageProps {
  title: string;
  orderId: string;
  successPath: string;
  subtitle?: string;
  /** If set, overrides the API-derived amount — for testing. */
  amountOverride?: number;
}

export function OrderPayPage({
  title,
  orderId,
  successPath,
  subtitle,
  amountOverride,
}: OrderPayPageProps) {
  const navigate = useNavigate();
  const { data: order } = useOrderDetail(orderId, 0);
  const { data: payTotal, isLoading: totalLoading } = usePayTotalAmount(orderId);
  const { data: pays, isLoading: paysLoading } = useOrderPays(orderId);
  const payCreate = usePayCreate();
  const payProcess = usePayProcess();
  const [selected, setSelected] = useState("");
  const remainingSeconds = usePayHoldCountdown(payTotal?.PayHoldTime);

  usePageHeader({ title, showBack: true });

  useEffect(() => {
    if (!selected && pays?.[0]?.PayType) {
      setSelected(pays[0].PayType);
    }
  }, [pays, selected]);

  const amount = amountOverride ?? payTotal?.TotalPayAmount ?? order?.TotalAmount;
  const isLoading = totalLoading || paysLoading;
  const isPending = payCreate.isPending || payProcess.isPending;
  const channels = pays ?? [];
  const payError =
    payCreate.error instanceof Error
      ? payCreate.error.message
      : payProcess.error instanceof Error
        ? payProcess.error.message
        : undefined;

  async function handlePay() {
    if (!selected) return;
    const result = await executeOrderPayFlow({
      orderId,
      payType: selected,
      createPay: (params) => payCreate.mutateAsync(params),
      processPay: (params) => payProcess.mutateAsync(params),
    });
    if (result.redirected) return;
    navigate(successPath, {
      replace: true,
      state: { paySucceeded: result.processed, message: result.message },
    });
  }

  if (isLoading) {
    return <p className="p-4 text-muted-foreground">加载支付信息…</p>;
  }

  return (
    <div className="space-y-4 p-4 pb-24">
      <h1 className="text-xl font-bold">选择支付方式</h1>
      {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
      <div className="space-y-1">
        <p className="text-lg font-semibold">应付 ¥{amount ?? "-"}</p>
        {remainingSeconds != null ? (
          <p className="text-sm text-muted-foreground">
            请在 {formatPayHoldCountdown(remainingSeconds)} 内完成支付
          </p>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">支付渠道</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {channels.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无可用支付方式</p>
          ) : (
            channels.map((channel) => (
              <label
                key={channel.PayType}
                className="flex cursor-pointer items-center gap-3 rounded-md border p-3"
              >
                <input
                  type="radio"
                  name="payType"
                  value={channel.PayType}
                  checked={selected === channel.PayType}
                  onChange={() => setSelected(channel.PayType)}
                />
                <span>{channel.PayTypeName}</span>
              </label>
            ))
          )}
        </CardContent>
      </Card>

      {payError ? <p className="text-sm text-destructive">{payError}</p> : null}

      <Button
        className="fixed bottom-4 left-4 right-4"
        disabled={!selected || isPending || channels.length === 0}
        onClick={() => void handlePay()}
      >
        {isPending ? "处理中…" : "确认支付"}
      </Button>
    </div>
  );
}
