import { useState } from "react";
import { Button } from "@ryx/ui/components/ui/button";

import { usePageHeader } from "@/components/layout";
import { OrderPayPage } from "@/pages/order/OrderPayPage";

export function PayTestPage() {
  usePageHeader({ visible: false });

  const [orderId, setOrderId] = useState("");
  const trimmed = orderId.trim();

  return (
    <div className="flex min-h-full flex-col bg-[#F5F6F9]">
      <div className="bg-gradient-to-b from-brand-header-start to-brand-header-end pt-[env(safe-area-inset-top)]">
        <div className="flex items-center px-1 pb-2 pt-1">
          <span className="w-10 shrink-0" />
          <h1 className="min-w-0 flex-1 text-center text-[17px] font-medium text-white">
            支付测试
          </h1>
          <span className="w-10 shrink-0" />
        </div>
      </div>

      {!trimmed ? (
        <div className="mx-4 mt-6 space-y-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="mb-2 text-sm text-[#6B7280]">输入订单号后自动展示支付页</p>
            <input
              type="text"
              value={orderId}
              placeholder="粘贴 OrderId"
              className="w-full rounded-xl border border-[#E8ECF2] bg-[#FAFBFC] px-3.5 py-3 text-sm text-[#111827] outline-none transition-colors placeholder:text-[#C4C9D4] focus:border-[#5099fe] focus:ring-2 focus:ring-[#5099fe]/10"
              onChange={(e) => setOrderId(e.target.value)}
            />
          </div>
          <p className="text-xs text-[#9CA3AF] px-1">
            提示：先在首页正常提交一笔订单，把订单号粘贴过来。
          </p>
        </div>
      ) : (
        <div className="flex-1">
          <div className="flex items-center gap-2 px-4 py-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setOrderId("")}
            >
              换号
            </Button>
            <input
              type="text"
              value={orderId}
              className="flex-1 rounded-lg border border-[#E8ECF2] bg-[#FAFBFC] px-2.5 py-1.5 text-xs text-[#111827] outline-none"
              onChange={(e) => setOrderId(e.target.value)}
            />
          </div>
          <OrderPayPage
            title="支付测试"
            orderId={trimmed}
            successPath="/dev/pay"
            subtitle="测试金额 ¥0.01"
            amountOverride={0.01}
          />
        </div>
      )}
    </div>
  );
}
