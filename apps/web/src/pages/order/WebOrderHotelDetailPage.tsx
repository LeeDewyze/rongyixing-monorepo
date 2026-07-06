import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { HotelOrderApprovalSection } from "@/components/order/hotel/HotelOrderApprovalSection";
import { HotelOrderBillSheet } from "@/components/order/hotel/HotelOrderBillSheet";
import {
  HotelOrderCancelDialog,
  HotelOrderSmsSheet,
} from "@/components/order/hotel/HotelOrderSmsSheet";
import { HotelOrderDetailFooter } from "@/components/order/hotel/HotelOrderDetailFooter";
import { HotelOrderHotelInfoCard } from "@/components/order/hotel/HotelOrderHotelInfoCard";
import { HotelOrderInfoCard } from "@/components/order/hotel/HotelOrderInfoCard";
import { HotelOrderRoomTabs } from "@/components/order/hotel/HotelOrderRoomTabs";
import { HotelOrderTravelerCard } from "@/components/order/hotel/HotelOrderTravelerCard";
import { WebOrderToast } from "@/components/order/WebOrderDetailShell";
import {
  useCancelHotelOrder,
  useHotelOrderDetail,
  useHotelOrderSms,
  useInspurRepush,
} from "@/hooks/useHotelOrderDetail";
import { resolveAppChannel } from "@/lib/app-channel";
import { formatApiError } from "@/lib/formatApiError";
import {
  coerceHotelOrderDetail,
  filterBillLinesForRoom,
  getCancelOrderHotelId,
  getSelectedRoom,
} from "@/lib/hotel-order-detail";
import { parseOrderListScope } from "@/lib/order-list-params";
import { buildOrderPayPath } from "@/lib/order-page-utils";
import { getOrderListPath } from "@/lib/order-routes";

interface OrderDetailLocationState {
  action?: "cancel";
}

function OrderDetailBackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-brand-title shadow-sm hover:bg-[#FAFBFC]"
      aria-label="返回"
      onClick={onBack}
    >
      <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 5l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

export function WebOrderHotelDetailPage() {
  const { orderId = "" } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const channel =
    searchParams.get("channel") === "tourist"
      ? "tourist"
      : searchParams.get("channel") === "tmc"
        ? "tmc"
        : undefined;
  const listScope = parseOrderListScope(searchParams.get("scope"));
  const location = useLocation();
  const openCancelOnMountRef = useRef(
    (location.state as OrderDetailLocationState | null)?.action === "cancel",
  );

  const {
    data: rawDetail,
    isLoading,
    isError,
    error,
    refetch,
  } = useHotelOrderDetail(orderId, channel);
  const detail = useMemo(
    () => (rawDetail ? coerceHotelOrderDetail(rawDetail) : undefined),
    [rawDetail],
  );
  const cancelMutation = useCancelHotelOrder();
  const sms = useHotelOrderSms(channel);
  const { data: showInspurRepush } = useInspurRepush(orderId, Boolean(detail));

  const [selectedRoomIndex, setSelectedRoomIndex] = useState(0);
  const [billOpen, setBillOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [smsOpen, setSmsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const leaveDetail = useCallback(() => {
    navigate(getOrderListPath("hotel", { channel, scope: listScope }), { replace: true });
  }, [channel, listScope, navigate]);

  const handleBack = useCallback(() => {
    if (billOpen) {
      setBillOpen(false);
      return;
    }
    if (smsOpen) {
      setSmsOpen(false);
      return;
    }
    leaveDetail();
  }, [billOpen, leaveDetail, smsOpen]);

  useEffect(() => {
    if (!openCancelOnMountRef.current || !detail?.Actions?.showCancel) {
      return;
    }
    openCancelOnMountRef.current = false;
    setCancelOpen(true);
  }, [detail?.Actions?.showCancel]);

  const selectedRoom = useMemo(
    () => (detail ? getSelectedRoom(detail, selectedRoomIndex) : undefined),
    [detail, selectedRoomIndex],
  );

  const billLines = useMemo(() => {
    if (!detail || !selectedRoom) return [];
    return filterBillLinesForRoom(detail.BillItems, selectedRoom.Key, detail.ShowServiceFee);
  }, [detail, selectedRoom]);

  const hideViolation = Boolean(detail?.SelfPayAmount && detail.SelfPayAmount > 0);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }, []);

  const handlePay = useCallback(() => {
    navigate(buildOrderPayPath("hotel", orderId, channel, listScope));
  }, [channel, listScope, navigate, orderId]);

  const runCancel = useCallback(async () => {
    if (!detail) return;
    const orderHotelId = getCancelOrderHotelId(detail);
    if (!orderHotelId) {
      showToast("无法取消：缺少房间信息");
      return;
    }
    try {
      await cancelMutation.mutateAsync({
        channel,
        OrderId: detail.OrderId,
        OrderHotelId: orderHotelId,
        Channel: resolveAppChannel(),
      });
      setCancelOpen(false);
      showToast("订单已取消");
      void refetch();
    } catch (err) {
      showToast(formatApiError(err));
    }
  }, [cancelMutation, channel, detail, refetch, showToast]);

  const handleCancelClick = useCallback(() => {
    if (!detail) return;
    const { smsAction } = detail.Actions;
    if (smsAction === "sendCode" || smsAction === "confirmCode") {
      setSmsOpen(true);
      return;
    }
    setCancelOpen(true);
  }, [detail]);

  const handleSmsSend = useCallback(
    async (mobile: string) => {
      const orderHotelId = detail ? getCancelOrderHotelId(detail) : undefined;
      if (!orderHotelId || !mobile.trim()) {
        showToast("请输入手机号");
        return;
      }
      try {
        await sms.send.mutateAsync({ Mobile: mobile.trim(), OrderHotelId: orderHotelId, orderId });
        showToast("验证码已发送");
        setSmsOpen(false);
      } catch (err) {
        showToast(formatApiError(err));
      }
    },
    [detail, orderId, showToast, sms.send],
  );

  const handleSmsConfirm = useCallback(
    async (code: string) => {
      const orderHotelId = detail ? getCancelOrderHotelId(detail) : undefined;
      if (!orderHotelId || !code.trim()) {
        showToast("请输入验证码");
        return;
      }
      try {
        await sms.confirm.mutateAsync({
          SmsCode: code.trim(),
          OrderHotelId: orderHotelId,
          orderId,
        });
        showToast("验证成功");
        setSmsOpen(false);
        setCancelOpen(true);
      } catch (err) {
        showToast(formatApiError(err));
      }
    },
    [detail, orderId, showToast, sms.confirm],
  );

  const smsMode = detail?.Actions.smsAction === "confirmCode" ? "confirmCode" : "sendCode";
  const showFooter = Boolean(detail?.Actions.showPay || detail?.Actions.showCancel);
  const pending = cancelMutation.isPending || sms.send.isPending || sms.confirm.isPending;

  return (
    <div className="min-h-full bg-[#F5F6F9]">
      <div className="mx-auto max-w-[960px] px-4 py-4">
        <div className="mb-4 flex items-center gap-3">
          <OrderDetailBackButton onBack={handleBack} />
        </div>

        {isLoading ? (
          <p className="text-center text-sm text-[#999999]">加载中…</p>
        ) : isError || !detail ? (
          <p className="text-center text-sm text-[#FF4D4F]">
            {formatApiError(error ?? new Error("订单不存在"))}
          </p>
        ) : (
          <div className={`space-y-3${showFooter ? " pb-24" : ""}`}>
            <HotelOrderInfoCard
              detail={detail}
              transactionId={selectedRoom?.Id}
              onShowBill={() => setBillOpen(true)}
            />

            <HotelOrderRoomTabs
              roomCount={detail.Rooms.length}
              selectedIndex={selectedRoomIndex}
              onSelect={setSelectedRoomIndex}
            />

            {selectedRoom ? (
              <>
                <HotelOrderHotelInfoCard room={selectedRoom} />
                <HotelOrderTravelerCard room={selectedRoom} hideViolation={hideViolation} />
              </>
            ) : null}

            <HotelOrderApprovalSection histories={detail.Histories} />

            {detail.Actions.smsAction === "readOnly" && detail.Actions.smsReadOnlyText ? (
              <p className="text-center text-[13px] text-[#666666]">
                {detail.Actions.smsReadOnlyText}
              </p>
            ) : null}
            {detail.Actions.smsError ? (
              <p className="text-center text-[13px] text-[#FF4D4F]">{detail.Actions.smsError}</p>
            ) : null}

            {showInspurRepush ? (
              <button
                type="button"
                className="w-full rounded-xl bg-white py-3 text-[14px] font-medium text-brand-primary shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                onClick={() => showToast("重推浪潮功能即将上线")}
              >
                重推浪潮
              </button>
            ) : null}
          </div>
        )}
      </div>

      {detail ? (
        <>
          <HotelOrderDetailFooter
            actions={detail.Actions}
            pending={pending}
            onCancel={handleCancelClick}
            onPay={handlePay}
          />

          <HotelOrderBillSheet
            open={billOpen}
            lines={billLines}
            onClose={() => setBillOpen(false)}
          />

          <HotelOrderCancelDialog
            open={cancelOpen}
            pending={cancelMutation.isPending}
            onConfirm={() => void runCancel()}
            onClose={() => setCancelOpen(false)}
          />

          {(detail.Actions.smsAction === "sendCode" ||
            detail.Actions.smsAction === "confirmCode") && (
            <HotelOrderSmsSheet
              open={smsOpen}
              mode={smsMode}
              mobile={detail.Actions.smsMobile}
              pending={sms.send.isPending || sms.confirm.isPending}
              error={detail.Actions.smsError}
              onSend={(mobile) => void handleSmsSend(mobile)}
              onConfirm={(code) => void handleSmsConfirm(code)}
              onClose={() => setSmsOpen(false)}
            />
          )}
        </>
      ) : null}

      <WebOrderToast message={toast} />
    </div>
  );
}
