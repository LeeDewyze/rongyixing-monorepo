import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { OrderDetailProductType } from "@ryx/shared-types";

import {
  useOrderPays,
  usePayCreate,
  usePayHoldCountdown,
  usePayProcess,
  usePayTotalAmount,
} from "@/hooks/useOrderPay";
import { useOrderDetail } from "@/hooks/useOrderDetail";
import { getApi } from "@/lib/api";
import { getAppId, getLegacyAppBaseUrl } from "@/lib/env";
import { formatApiError } from "@/lib/formatApiError";
import {
  buildLegacyH5PayUrl,
  executeOrderPayFlow,
  formatPayHoldCountdown,
  shouldUseLegacyH5PayRedirect,
} from "@/lib/order-pay";
import { parseProductChannel } from "@/lib/order-page-utils";
import { savePendingPayContext } from "@/lib/pay-result-callback";
import { getOrderResultPath } from "@/lib/order-routes";
import { getRequestDomain, getRequestLanguage, getTicketName } from "@/lib/request-context";
import { getTicket } from "@/lib/session";
import { resolveTouristContext } from "@/lib/tourist-context";

const PRODUCT_TITLES: Record<OrderDetailProductType, string> = {
  Flight: "机票支付",
  Train: "火车票支付",
  Hotel: "酒店支付",
  Car: "用车支付",
};

function formatPayAmount(amount: number | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return "-";
  return amount.toLocaleString("zh-CN", {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

function payChannelIcon(label: string): string {
  if (label.includes("微信")) return "微";
  if (label.includes("工行") || label.includes("工商")) return "工";
  if (label.includes("支付宝")) return "支";
  return label.slice(0, 1) || "付";
}

export interface WebOrderPayPageProps {
  productType: OrderDetailProductType;
}

export function WebOrderPayPage({ productType }: WebOrderPayPageProps) {
  const { orderId = "" } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const channel = parseProductChannel(searchParams);
  const successPath = getOrderResultPath(
    productType === "Flight" ? "Flight" : productType === "Train" ? "Train" : "Hotel",
    orderId,
  );

  const { data: order } = useOrderDetail(orderId, 0, channel);
  const { data: payTotal, isLoading: totalLoading } = usePayTotalAmount(orderId, {
    channel,
    productType,
  });
  const { data: pays, isLoading: paysLoading } = useOrderPays(orderId, { channel, productType });
  const payCreate = usePayCreate();
  const payProcess = usePayProcess();
  const [selected, setSelected] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const remainingSeconds = usePayHoldCountdown(payTotal?.PayHoldTime);

  useEffect(() => {
    if (!selected && pays?.[0]?.PayType) {
      setSelected(pays[0].PayType);
    }
  }, [pays, selected]);

  const amount = payTotal?.TotalPayAmount ?? order?.TotalAmount;
  const isLoading = totalLoading || paysLoading;
  const isPending = payCreate.isPending || payProcess.isPending;
  const channels = pays ?? [];
  const selectedChannel = channels.find((item) => item.PayType === selected);
  const payError =
    errorMessage ??
    (payCreate.error ? formatApiError(payCreate.error) : undefined) ??
    (payProcess.error ? formatApiError(payProcess.error) : undefined);

  async function handlePay() {
    if (!selected) return;
    setErrorMessage(null);
    try {
      if (shouldUseLegacyH5PayRedirect({ channel, productType, payType: selected })) {
        const api = getApi();
        const apiConfig = api.proxy.getApiConfig() ?? (await api.proxy.loadApiConfig());
        const context = await resolveTouristContext({
          appId: getAppId(),
          sender: api.proxy,
        });
        savePendingPayContext({
          payType: selected,
          channel,
          productType,
        });
        window.location.assign(
          buildLegacyH5PayUrl({
            appBaseUrl: getLegacyAppBaseUrl(),
            orderId,
            payType: selected,
            ticket: getTicket() ?? "",
            ticketName: getTicketName(),
            domain: getRequestDomain(),
            language: getRequestLanguage(),
            token: apiConfig.Token ?? "",
            tmcId: context.TouristTmcId,
            mmsId: context.TouristMmsId,
            createType: "Mobile",
          }),
        );
        return;
      }
      const result = await executeOrderPayFlow({
        orderId,
        payType: selected,
        createPay: (params) =>
          payCreate.mutateAsync({ ...params, channel, ProductType: productType }),
        processPay: (params) =>
          payProcess.mutateAsync({ ...params, channel, ProductType: productType }),
      });
      if (result.redirected) return;
      const params = new URLSearchParams();
      if (channel) params.set("channel", channel);
      const scope = searchParams.get("scope");
      if (scope) params.set("scope", scope);
      const nextPath = params.size > 0 ? `${successPath}?${params.toString()}` : successPath;
      navigate(nextPath, {
        replace: true,
        state: { paySucceeded: result.processed, message: result.message },
      });
    } catch (error) {
      setErrorMessage(formatApiError(error));
    }
  }

  return (
    <div className="min-h-full bg-[#F5F6F9]">
      <div className="mx-auto w-full max-w-[640px] px-4 py-4">
        <header className="mb-4 flex items-center gap-3">
          <button
            type="button"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-brand-title shadow-sm hover:bg-[#FAFBFC]"
            aria-label="返回"
            onClick={() => navigate(-1)}
          >
            <svg
              viewBox="0 0 20 20"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 5l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="text-[18px] font-semibold text-brand-title">
            {PRODUCT_TITLES[productType]}
          </h1>
        </header>

        <section className="mb-4 rounded-2xl bg-white px-4 py-4 shadow-sm">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] text-[#666666]">应付金额</p>
              <p className="mt-1 text-[30px] font-semibold leading-none text-[#FF383C]">
                <span className="text-[20px]">¥</span>
                {formatPayAmount(amount)}
              </p>
            </div>
            {remainingSeconds != null ? (
              <div className="shrink-0 rounded-full bg-[#EEF5FF] px-3 py-1.5 text-[12px] font-medium text-brand-primary">
                请在 {formatPayHoldCountdown(remainingSeconds)} 内完成支付
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-[16px] font-semibold text-brand-title">支付渠道</h2>
          {isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-[58px] animate-pulse rounded-xl bg-[#F5F6F9]" />
              ))}
            </div>
          ) : channels.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#999999]">暂无可用支付方式</p>
          ) : (
            <div className="space-y-3">
              {channels.map((payChannel) => {
                const checked = selected === payChannel.PayType;
                return (
                  <label
                    key={payChannel.PayType}
                    className={`flex min-h-[58px] cursor-pointer items-center gap-3 rounded-xl border px-3.5 transition-colors hover:bg-[#FAFBFC] ${
                      checked ? "border-brand-primary bg-[#EEF5FF]" : "border-[#EEF0F4] bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payType"
                      value={payChannel.PayType}
                      className="sr-only"
                      checked={checked}
                      onChange={() => setSelected(payChannel.PayType)}
                    />
                    <span
                      className={`flex size-9 shrink-0 items-center justify-center rounded-full text-[14px] font-semibold ${
                        checked ? "bg-brand-primary text-white" : "bg-[#F5F8FF] text-brand-primary"
                      }`}
                    >
                      {payChannelIcon(payChannel.PayTypeName)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-brand-title">
                      {payChannel.PayTypeName}
                    </span>
                    {selectedChannel?.PayType === payChannel.PayType ? (
                      <span className="text-[12px] text-brand-primary">已选</span>
                    ) : null}
                  </label>
                );
              })}
            </div>
          )}
        </section>

        {payError ? (
          <p className="mt-3 rounded-xl bg-[#FFF1F0] px-3 py-2 text-[13px] text-[#FF4D4F]">
            {payError}
          </p>
        ) : null}

        <button
          type="button"
          className="mt-6 flex h-11 w-full items-center justify-center rounded-lg bg-gradient-to-r from-brand-btn-start to-brand-btn-end text-sm font-medium text-white shadow-[0_8px_20px_rgba(39,104,250,0.24)] disabled:opacity-50"
          disabled={!selected || isPending || channels.length === 0 || isLoading}
          onClick={() => void handlePay()}
        >
          {isPending ? "处理中…" : "确认支付"}
        </button>
      </div>
    </div>
  );
}
