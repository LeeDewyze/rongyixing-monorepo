import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { usePageHeader } from "@/components/layout";
import { HotelOrderApprovalSection } from "@/components/order/hotel/HotelOrderApprovalSection";
import {
  HotelOrderDetailHeader,
  ORDER_DETAIL_HEADER_FALLBACK_HEIGHT,
} from "@/components/order/hotel/HotelOrderDetailHeader";
import { FlightOrderBillSheet } from "@/components/order/flight/FlightOrderBillSheet";
import { FlightOrderCancelDialog } from "@/components/order/flight/FlightOrderCancelDialog";
import { FlightOrderContactCard } from "@/components/order/flight/FlightOrderContactCard";
import { FlightOrderDetailFooter } from "@/components/order/flight/FlightOrderDetailFooter";
import { FlightOrderExplainSheet } from "@/components/order/flight/FlightOrderExplainSheet";
import { FlightOrderInfoCard } from "@/components/order/flight/FlightOrderInfoCard";
import { FlightOrderPassengerTabs } from "@/components/order/flight/FlightOrderPassengerTabs";
import { FlightOrderRefundDialog } from "@/components/order/flight/FlightOrderRefundDialog";
import { FlightOrderSegmentCard } from "@/components/order/flight/FlightOrderSegmentCard";
import { FlightOrderTravelerCard } from "@/components/order/flight/FlightOrderTravelerCard";
import {
  useCancelFlightOrder,
  useFlightOrderDetail,
  useFlightPayHoldCountdown,
  useFlightTicketRefundInfo,
  useNonVoluntaryRefundFlightOrder,
  useRefundFlightOrder,
} from "@/hooks/useFlightOrderDetail";
import { useInspurRepush } from "@/hooks/useHotelOrderDetail";
import { resolveAppChannel } from "@/lib/app-channel";
import { formatApiError } from "@/lib/formatApiError";
import {
  filterBillLinesForTicket,
  getSelectedTicket,
  resolveCancelTarget,
  shouldShowFlightFooter,
} from "@/lib/flight-order-detail";
import { TAB_ID_TO_PARAM } from "@/lib/order-list-params";
import { scrollH5MainToTop } from "@/lib/scroll-h5-main";

const FOOTER_OFFSET = "calc(4.5rem + env(safe-area-inset-bottom))";
const ORDERS_FLIGHT_FALLBACK = `/home/orders?tab=${TAB_ID_TO_PARAM.flight}`;

interface OrderDetailLocationState {
  action?: "cancel" | "refund";
  ticketId?: string;
}

type FlightRefundKind = "voluntary" | "nonVoluntary";

export function OrderFlightDetailPage() {
  const { orderId = "" } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const channel = searchParams.get("channel") === "tourist" ? "tourist" : undefined;
  const location = useLocation();
  const openCancelOnMountRef = useRef(
    (location.state as OrderDetailLocationState | null)?.action === "cancel",
  );
  const cancelTicketIdRef = useRef(
    (location.state as OrderDetailLocationState | null)?.ticketId,
  );
  const cancelFromListRef = useRef(
    (location.state as OrderDetailLocationState | null)?.action === "cancel" &&
      Boolean((location.state as OrderDetailLocationState | null)?.ticketId),
  );
  const openRefundOnMountRef = useRef(
    (location.state as OrderDetailLocationState | null)?.action === "refund",
  );
  const refundTicketIdRef = useRef(
    (location.state as OrderDetailLocationState | null)?.ticketId,
  );
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(ORDER_DETAIL_HEADER_FALLBACK_HEIGHT);

  const { data: detail, isLoading, isError, error, refetch } = useFlightOrderDetail(
    orderId,
    channel,
  );
  const cancelMutation = useCancelFlightOrder();
  const refundMutation = useRefundFlightOrder();
  const nonVoluntaryRefundMutation = useNonVoluntaryRefundFlightOrder();
  const { data: showInspurRepush } = useInspurRepush(orderId, Boolean(detail));
  const payHoldSecondsRemaining = useFlightPayHoldCountdown(detail?.PayHoldMinutes);

  const [selectedTicketIndex, setSelectedTicketIndex] = useState(0);
  const [billOpen, setBillOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundKind, setRefundKind] = useState<FlightRefundKind>("voluntary");
  const [explainOpen, setExplainOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const leaveDetail = useCallback(() => {
    navigate(ORDERS_FLIGHT_FALLBACK, { replace: true });
  }, [navigate]);

  const handleBack = useCallback(() => {
    if (billOpen) {
      setBillOpen(false);
      return;
    }
    if (explainOpen) {
      setExplainOpen(false);
      return;
    }
    leaveDetail();
  }, [billOpen, explainOpen, leaveDetail]);

  usePageHeader({ visible: false });

  useLayoutEffect(() => {
    scrollH5MainToTop();
  }, [orderId]);

  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) {
      return;
    }

    const updateHeight = () => {
      setHeaderHeight(header.offsetHeight);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }, []);

  useEffect(() => {
    setSelectedTicketIndex(0);
    cancelTicketIdRef.current = (location.state as OrderDetailLocationState | null)?.ticketId;
    cancelFromListRef.current =
      (location.state as OrderDetailLocationState | null)?.action === "cancel" &&
      Boolean((location.state as OrderDetailLocationState | null)?.ticketId);
    refundTicketIdRef.current = (location.state as OrderDetailLocationState | null)?.ticketId;
  }, [location.state, orderId]);

  useEffect(() => {
    if (!openCancelOnMountRef.current || !detail) {
      return;
    }

    const targetTicketId = cancelTicketIdRef.current;
    const targetIndex = targetTicketId
      ? detail.Tickets.findIndex((ticket) => ticket.Id === targetTicketId)
      : selectedTicketIndex;

    if (targetTicketId && targetIndex < 0) {
      openCancelOnMountRef.current = false;
      cancelTicketIdRef.current = undefined;
      showToast("未找到可取消的客票");
      return;
    }

    if (targetIndex >= 0 && targetIndex !== selectedTicketIndex) {
      setSelectedTicketIndex(targetIndex);
      return;
    }

    const canCancel = targetTicketId
      ? detail.Tickets[targetIndex]?.Actions?.showCancel
      : detail.Actions?.showCancel;
    if (!canCancel) {
      openCancelOnMountRef.current = false;
      cancelTicketIdRef.current = undefined;
      cancelFromListRef.current = false;
      showToast("该客票暂不可取消");
      return;
    }

    openCancelOnMountRef.current = false;
    cancelTicketIdRef.current = undefined;
    setCancelOpen(true);
  }, [detail, selectedTicketIndex, showToast]);

  const selectedTicket = useMemo(
    () => (detail ? getSelectedTicket(detail, selectedTicketIndex) : undefined),
    [detail, selectedTicketIndex],
  );

  const refundInfo = useFlightTicketRefundInfo(
    refundOpen && selectedTicket ? { orderFlightTicket: selectedTicket.Id, channel } : null,
  );

  useEffect(() => {
    if (!openRefundOnMountRef.current || !detail) {
      return;
    }

    const targetTicketId = refundTicketIdRef.current;
    const targetIndex = targetTicketId
      ? detail.Tickets.findIndex((ticket) => ticket.Id === targetTicketId)
      : selectedTicketIndex;

    if (targetIndex < 0) {
      openRefundOnMountRef.current = false;
      refundTicketIdRef.current = undefined;
      showToast("未找到可退票的客票");
      return;
    }

    const targetTicket = detail.Tickets[targetIndex];
    if (!targetTicket?.Actions?.showRefund) {
      openRefundOnMountRef.current = false;
      refundTicketIdRef.current = undefined;
      showToast("该客票暂不可退票");
      return;
    }

    if (targetIndex !== selectedTicketIndex) {
      setSelectedTicketIndex(targetIndex);
      return;
    }

    openRefundOnMountRef.current = false;
    refundTicketIdRef.current = undefined;
    setRefundOpen(true);
  }, [detail, selectedTicketIndex, showToast]);

  const billLines = useMemo(() => {
    if (!detail || !selectedTicket) return [];
    return filterBillLinesForTicket(
      detail.BillItems,
      selectedTicket.Key,
      detail.ShowServiceFee ?? true,
    );
  }, [detail, selectedTicket]);

  const handlePay = useCallback(() => {
    const payPath =
      channel === "tourist"
        ? `/flight/pay/${encodeURIComponent(orderId)}?channel=tourist`
        : `/flight/pay/${encodeURIComponent(orderId)}`;
    navigate(payPath);
  }, [channel, navigate, orderId]);

  const runCancel = useCallback(async () => {
    if (!detail) return;
    const target = cancelFromListRef.current && selectedTicket
      ? { mode: "ticket" as const, ticketId: selectedTicket.Id }
      : resolveCancelTarget(detail);
    if (!target) {
      showToast("无法取消：缺少客票信息");
      return;
    }
    try {
      if (target.mode === "ticket") {
        await cancelMutation.mutateAsync({
          mode: "ticket",
          params: {
            channel,
            OrderId: detail.OrderId,
            TicketId: target.ticketId,
            Tag: "flight",
          },
        });
      } else {
        await cancelMutation.mutateAsync({
          mode: "order",
          params: {
            channel,
            OrderId: detail.OrderId,
            TicketId: target.ticketId,
            Channel: resolveAppChannel(),
          },
        });
      }
      setCancelOpen(false);
      cancelFromListRef.current = false;
      showToast("订单已取消");
      void refetch();
    } catch (err) {
      showToast(formatApiError(err));
    }
  }, [cancelMutation, channel, detail, refetch, selectedTicket, showToast]);

  const runRefund = useCallback(async () => {
    if (!detail || !selectedTicket) return;
    try {
      if (refundKind === "nonVoluntary") {
        const result = await nonVoluntaryRefundMutation.mutateAsync({
          channel,
          OrderFlightTicketId: selectedTicket.Id,
          OrderId: detail.OrderId,
          IsVoluntary: false,
        });
        setRefundOpen(false);
        showToast(result?.Message || "退票申请中");
      } else {
        await refundMutation.mutateAsync({
          channel,
          orderId: detail.OrderId,
          ticketId: selectedTicket.Id,
          IsVoluntary: true,
        });
        setRefundOpen(false);
        showToast("退票申请中");
      }
      void refetch();
    } catch (err) {
      showToast(formatApiError(err));
    }
  }, [
    detail,
    nonVoluntaryRefundMutation,
    channel,
    refundKind,
    refundMutation,
    refetch,
    selectedTicket,
    showToast,
  ]);

  const showFooter = detail
    ? shouldShowFlightFooter(detail.Actions, payHoldSecondsRemaining, selectedTicket)
    : false;
  const pending =
    cancelMutation.isPending ||
    refundMutation.isPending ||
    nonVoluntaryRefundMutation.isPending;

  return (
    <div className="min-h-screen bg-[#F5F6F9]">
      <HotelOrderDetailHeader ref={headerRef} onBack={handleBack} />

      <div style={{ paddingTop: headerHeight }}>
        {isLoading ? (
          <p className="px-4 pt-3 text-center text-sm text-[#999999]">加载中…</p>
        ) : isError || !detail ? (
          <p className="px-4 pt-3 text-center text-sm text-[#FF4D4F]">
            {formatApiError(error ?? new Error("订单不存在"))}
          </p>
        ) : (
      <div
        className="space-y-3 px-4 pb-6 pt-3"
        style={{ paddingBottom: showFooter ? FOOTER_OFFSET : "1.5rem" }}
      >
        <FlightOrderInfoCard
          detail={detail}
          transactionId={selectedTicket?.Id}
          payHoldSecondsRemaining={payHoldSecondsRemaining}
          onShowBill={() => setBillOpen(true)}
        />

        <FlightOrderPassengerTabs
          tickets={detail.Tickets}
          selectedIndex={selectedTicketIndex}
          onSelect={setSelectedTicketIndex}
        />

        {selectedTicket ? (
          <>
            <FlightOrderSegmentCard
              ticket={selectedTicket}
              onShowExplain={() => setExplainOpen(true)}
            />
            <FlightOrderTravelerCard ticket={selectedTicket} />
          </>
        ) : null}

        <FlightOrderContactCard contact={detail.Contact} />

        <HotelOrderApprovalSection histories={detail.Histories ?? []} />

        {showInspurRepush ? (
          <button
            type="button"
            className="w-full rounded-xl bg-white py-3 text-[14px] font-medium text-[#2768FA] shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
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
          <FlightOrderDetailFooter
            actions={detail.Actions}
            selectedTicket={selectedTicket}
            payHoldSecondsRemaining={payHoldSecondsRemaining}
            pending={pending}
            onCancel={() => setCancelOpen(true)}
            onPay={handlePay}
            onRefund={() => {
              setRefundKind("voluntary");
              setRefundOpen(true);
            }}
          />

          <FlightOrderBillSheet
            open={billOpen}
            ticket={selectedTicket}
            lines={billLines}
            onClose={() => setBillOpen(false)}
          />

          <FlightOrderCancelDialog
            open={cancelOpen}
            pending={pending}
            onConfirm={() => void runCancel()}
            onClose={() => {
              cancelFromListRef.current = false;
              setCancelOpen(false);
            }}
          />

          <FlightOrderRefundDialog
            open={refundOpen}
            refundInfo={refundInfo.data}
            loading={refundInfo.isLoading}
            error={refundInfo.error}
            selectedKind={refundKind}
            pending={pending}
            onKindChange={setRefundKind}
            onConfirm={() => void runRefund()}
            onClose={() => setRefundOpen(false)}
          />

          <FlightOrderExplainSheet
            open={explainOpen}
            explain={selectedTicket?.Explain}
            onClose={() => setExplainOpen(false)}
          />
        </>
      ) : null}

      {toast ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
          <p className="rounded-lg bg-black/75 px-4 py-2 text-[13px] text-white">{toast}</p>
        </div>
      ) : null}
    </div>
  );
}
