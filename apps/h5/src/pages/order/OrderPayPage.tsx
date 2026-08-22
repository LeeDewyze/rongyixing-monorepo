import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { OrderDetailProductType, ProductChannel } from "@ryx/shared-types";

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
  buildLegacyH5PayUrl,
  executeOrderPayFlow,
  formatPayHoldCountdown,
  resolvePayCreateOutTradeNo,
  resolvePayFailureMessage,
  resolveLegacyH5PayType,
  shouldUseLegacyH5PayRedirect,
} from "@/lib/order-pay";
import { getApi } from "@/lib/api";
import { getApiMode, getAppId, getLegacyAppBaseUrl, getWechatAppId } from "@/lib/env";
import { getRequestDomain, getRequestLanguage, getTicketName } from "@/lib/request-context";
import { getTicket } from "@/lib/session";
import { resolveTouristContext } from "@/lib/tourist-context";
import { payWithWechatJsSdk } from "@/lib/wechat-pay";
import { getWechatOpenId, isWechatH5, redirectToWechatOAuth } from "@/lib/wechat-oauth";

export interface OrderPayPageProps {
  title: string;
  orderId: string;
  successPath: string;
  productType: OrderDetailProductType;
  subtitle?: string;
  /** If set, overrides the API-derived amount — for testing. */
  amountOverride?: number;
}

const ORDER_PAY_HEADER_FALLBACK_HEIGHT = 88;

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

function resolveDisplayPayAmount(input: {
  override?: number;
  payTotal?: number;
  selfPayAmount?: number;
  orderTotal?: number;
}): number | undefined {
  const { override, payTotal, selfPayAmount, orderTotal } = input;
  if (override != null) return override;
  if (payTotal != null && Number.isFinite(payTotal) && payTotal > 0) return payTotal;
  if (selfPayAmount != null && Number.isFinite(selfPayAmount) && selfPayAmount > 0) {
    return selfPayAmount;
  }
  if (orderTotal != null && Number.isFinite(orderTotal) && orderTotal > 0) return orderTotal;
  return payTotal ?? selfPayAmount ?? orderTotal;
}

export function OrderPayPage({
  title,
  orderId,
  successPath,
  productType,
  subtitle,
  amountOverride,
}: OrderPayPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(ORDER_PAY_HEADER_FALLBACK_HEIGHT);
  const channel: ProductChannel | undefined =
    searchParams.get("channel") === "tourist"
      ? "tourist"
      : searchParams.get("channel") === "tmc"
        ? "tmc"
        : undefined;
  const { data: order } = useOrderDetail(orderId, 0, channel);
  const { data: payTotal, isLoading: totalLoading } = usePayTotalAmount(orderId, {
    channel,
    productType,
  });
  const { data: pays, isLoading: paysLoading } = useOrderPays(orderId, {
    channel,
    productType,
  });
  const payCreate = usePayCreate();
  const payProcess = usePayProcess();
  const [selected, setSelected] = useState("");
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const remainingSeconds = usePayHoldCountdown(payTotal?.PayHoldTime);

  usePageHeader({ visible: false });

  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return undefined;

    const updateHeight = () => setHeaderHeight(header.offsetHeight);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!selected && pays?.[0]?.PayType) {
      setSelected(pays[0].PayType);
    }
  }, [pays, selected]);

  const amount = resolveDisplayPayAmount({
    override: amountOverride,
    payTotal: payTotal?.TotalPayAmount,
    selfPayAmount: order?.SelfPayAmount,
    orderTotal: order?.TotalAmount,
  });
  const isLoading = totalLoading || paysLoading;
  const isPending = payCreate.isPending || payProcess.isPending;
  const channels = pays ?? [];
  const selectedChannel = channels.find((item) => item.PayType === selected);
  const payError =
    paymentError ??
    (payCreate.error instanceof Error
      ? payCreate.error.message
      : payProcess.error instanceof Error
        ? payProcess.error.message
        : undefined);

  async function handlePay() {
    if (!selected) return;
    setPaymentError(null);
    if (shouldUseLegacyH5PayRedirect({ channel, productType, payType: selected })) {
      const openid = getWechatOpenId();
      const wechatH5 = isWechatH5();
      if (wechatH5 && !openid && resolveLegacyH5PayType(selected) === "3") {
        redirectToWechatOAuth({
          appBaseUrl:
            getApiMode() === "proxy" && typeof window !== "undefined"
              ? window.location.origin
              : getLegacyAppBaseUrl(),
          domain: getRequestDomain(),
          ticket: getTicket() ?? "",
          ticketName: getTicketName(),
        });
        return;
      }
      if (wechatH5 && resolveLegacyH5PayType(selected) === "3") {
        try {
          const created = await payCreate.mutateAsync({
            OrderId: orderId,
            PayType: selected,
            channel,
            ProductType: productType,
            CreateType: "JsSdk",
            DataType: "json",
            OpenId: openid,
            WechatAppId: getWechatAppId(),
            IsShowLoading: true,
          });
          const failureMessage = resolvePayFailureMessage(created);
          if (failureMessage) throw new Error(failureMessage);
          await payWithWechatJsSdk(created);
          const outTradeNo = resolvePayCreateOutTradeNo(created);
          if (!outTradeNo) throw new Error("微信支付未返回支付订单号");
          await payProcess.mutateAsync({
            OutTradeNo: outTradeNo,
            Type: selected,
            channel,
            ProductType: productType,
          });
          const [base = successPath, search = ""] = successPath.split("?");
          const params = new URLSearchParams(search);
          if (channel) params.set("channel", channel);
          const scope = searchParams.get("scope");
          if (scope) params.set("scope", scope);
          const nextSuccessPath = params.size > 0 ? `${base}?${params.toString()}` : base;
          navigate(nextSuccessPath, {
            replace: true,
            state: { paySucceeded: true },
          });
        } catch (error) {
          setPaymentError(error instanceof Error ? error.message : "微信支付失败");
        }
        return;
      }
      const api = getApi();
      const apiConfig = api.proxy.getApiConfig() ?? (await api.proxy.loadApiConfig());
      const context = await resolveTouristContext({
        appId: getAppId(),
        sender: api.proxy,
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
          openid,
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
    const [base = successPath, search = ""] = successPath.split("?");
    const params = new URLSearchParams(search);
    if (channel) {
      params.set("channel", channel);
    }
    const scope = searchParams.get("scope");
    if (scope) {
      params.set("scope", scope);
    }
    const nextSuccessPath = params.size > 0 ? `${base}?${params.toString()}` : base;
    navigate(nextSuccessPath, {
      replace: true,
      state: { paySucceeded: result.processed, message: result.message },
    });
  }

  return (
    <div
      className="ryx-viewport-h relative overflow-hidden"
      style={{ background: "var(--brand-form-header-gradient)" }}
    >
      <div
        ref={headerRef}
        className="fixed inset-x-0 top-0 z-30 w-full"
        style={{ background: "var(--brand-form-header-gradient)" }}
      >
        <div className="pt-[env(safe-area-inset-top)]">
          <div className="flex items-center px-1 pb-2 pt-1">
            <button
              type="button"
              className="flex size-10 shrink-0 items-center justify-center text-brand-title active:opacity-70"
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
            <h1 className="min-w-0 flex-1 text-center text-[17px] font-medium text-brand-title">
              {title}
            </h1>
            <span className="size-10 shrink-0" aria-hidden />
          </div>
        </div>
      </div>

      <div className="flex h-full flex-col" style={{ paddingTop: headerHeight }}>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain touch-pan-y px-4 pb-4 pt-3 [-webkit-overflow-scrolling:touch]">
          <section className="mb-4 rounded-2xl bg-white/78 px-4 py-4 shadow-sm backdrop-blur">
            {subtitle ? (
              <p className="truncate text-[15px] leading-5 text-brand-title/65">{subtitle}</p>
            ) : null}
            <div className="mt-4 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] text-brand-title/55">应付金额</p>
                <p className="mt-1 text-[30px] font-semibold leading-none tracking-tight text-brand-title">
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
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[16px] font-semibold text-brand-title">支付渠道</h2>
              {selectedChannel ? (
                <span className="rounded-full bg-[#EEF5FF] px-2.5 py-1 text-[12px] font-medium text-brand-primary">
                  {selectedChannel.PayTypeName}
                </span>
              ) : null}
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="h-[58px] animate-pulse rounded-xl bg-[#F5F6F9]"
                    aria-hidden
                  />
                ))}
              </div>
            ) : channels.length === 0 ? (
              <div className="py-8 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#EEF5FF] text-brand-primary">
                  <span className="text-[18px] font-semibold">付</span>
                </div>
                <p className="mt-3 text-[15px] font-medium text-brand-title">暂无可用支付方式</p>
                <p className="mt-1 text-[13px] text-brand-title/45">请稍后重试或返回订单详情</p>
              </div>
            ) : (
              <div className="space-y-3">
                {channels.map((channel) => {
                  const checked = selected === channel.PayType;
                  return (
                    <label
                      key={channel.PayType}
                      className={`flex min-h-[58px] cursor-pointer items-center gap-3 rounded-xl border px-3.5 transition-colors active:scale-[0.99] ${
                        checked
                          ? "border-brand-primary bg-[#EEF5FF]"
                          : "border-[#EEF0F4] bg-white active:bg-[#FAFBFC]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payType"
                        value={channel.PayType}
                        className="sr-only"
                        checked={checked}
                        onChange={() => setSelected(channel.PayType)}
                      />
                      <span
                        className={`flex size-9 shrink-0 items-center justify-center rounded-full text-[14px] font-semibold ${
                          checked
                            ? "bg-brand-primary text-white"
                            : "bg-[#F5F8FF] text-brand-primary"
                        }`}
                        aria-hidden
                      >
                        {payChannelIcon(channel.PayTypeName)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-brand-title">
                        {channel.PayTypeName}
                      </span>
                      <span
                        className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                          checked ? "border-brand-primary bg-brand-primary" : "border-[#D0D5DD]"
                        }`}
                        aria-hidden
                      >
                        {checked ? <span className="size-2 rounded-full bg-white" /> : null}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </section>

          {payError ? (
            <p className="mt-3 rounded-xl bg-[#FFF1F0] px-3 py-2 text-[13px] leading-5 text-[#FF4D4F]">
              {payError}
            </p>
          ) : null}
        </div>

        <div className="shrink-0 border-t border-[#ECECEC] bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <button
            type="button"
            className="flex h-11 w-full items-center justify-center rounded-lg bg-gradient-to-r from-brand-btn-start to-brand-btn-end text-sm font-medium text-white shadow-[0_8px_20px_rgba(39,104,250,0.24)] transition-opacity active:opacity-90 disabled:opacity-50"
            disabled={!selected || isPending || channels.length === 0 || isLoading}
            onClick={() => void handlePay()}
          >
            {isPending ? "处理中…" : "确认支付"}
          </button>
        </div>
      </div>
    </div>
  );
}
