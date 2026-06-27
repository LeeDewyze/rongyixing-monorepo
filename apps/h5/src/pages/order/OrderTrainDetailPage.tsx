import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { TrainPassengerInfo, TrainScheduleParams } from "@ryx/shared-types";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { usePageHeader } from "@/components/layout";
import { HotelOrderApprovalSection } from "@/components/order/hotel/HotelOrderApprovalSection";
import {
  HotelOrderDetailHeader,
  ORDER_DETAIL_HEADER_FALLBACK_HEIGHT,
} from "@/components/order/hotel/HotelOrderDetailHeader";
import { FlightOrderContactCard } from "@/components/order/flight/FlightOrderContactCard";
import { TrainOrderBillSheet } from "@/components/order/train/TrainOrderBillSheet";
import { TrainOrderCancelDialog } from "@/components/order/train/TrainOrderCancelDialog";
import { TrainOrderDetailFooter } from "@/components/order/train/TrainOrderDetailFooter";
import { TrainOrderExplainSheet } from "@/components/order/train/TrainOrderExplainSheet";
import { TrainOrderHoldBanner } from "@/components/order/train/TrainOrderHoldBanner";
import { TrainOrderInfoCard } from "@/components/order/train/TrainOrderInfoCard";
import { TrainOrderIssueDialog } from "@/components/order/train/TrainOrderIssueDialog";
import { TrainOrderJourneyCard } from "@/components/order/train/TrainOrderJourneyCard";
import { TrainOrderPassengerTabs } from "@/components/order/train/TrainOrderPassengerTabs";
import { TrainOrderRefundDialog } from "@/components/order/train/TrainOrderRefundDialog";
import { TrainOrderTravelerCard } from "@/components/order/train/TrainOrderTravelerCard";
import { TrainScheduleSheet } from "@/components/train/TrainScheduleSheet";
import {
  useCancelTrainOrder,
  useIssueTrainOrder,
  useRefundTrainOrder,
  useTrainOrderDetail,
  useTrainPayHoldCountdown,
} from "@/hooks/useTrainOrderDetail";
import { useTrainSchedule } from "@/hooks/useTrainSchedule";
import { resolveAppChannel } from "@/lib/app-channel";
import { formatApiError } from "@/lib/formatApiError";
import { getApi } from "@/lib/api";
import { startTrainExchangeFlow } from "@/lib/train-order-actions";
import {
  filterBillLinesForTicket,
  getSelectedTicket,
  mergeTrainFooterActions,
  shouldShowTrainFooter,
  shouldShowTrainOrderHoldBanner,
} from "@/lib/train-order-detail";
import { buildTrainScheduleParamsFromTrip } from "@/lib/train-schedule";
import { TAB_ID_TO_PARAM } from "@/lib/order-list-params";
import { scrollH5MainToTopAfterLayout } from "@/lib/scroll-h5-main";

const FOOTER_OFFSET = "calc(4.5rem + env(safe-area-inset-bottom))";
const FOOTER_OFFSET_WITH_SECONDARY = "calc(7rem + env(safe-area-inset-bottom))";
const ORDERS_TRAIN_FALLBACK = `/home/orders?tab=${TAB_ID_TO_PARAM.train}`;

interface OrderDetailLocationState {
  action?: "cancel" | "refund";
}

export function OrderTrainDetailPage() {
  const { orderId = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const openCancelOnMountRef = useRef(
    (location.state as OrderDetailLocationState | null)?.action === "cancel",
  );
  const openRefundOnMountRef = useRef(
    (location.state as OrderDetailLocationState | null)?.action === "refund",
  );
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(ORDER_DETAIL_HEADER_FALLBACK_HEIGHT);

  const { data: detail, isLoading, isError, error, refetch } = useTrainOrderDetail(orderId);
  const cancelMutation = useCancelTrainOrder();
  const issueMutation = useIssueTrainOrder();
  const refundMutation = useRefundTrainOrder();
  const payHoldSecondsRemaining = useTrainPayHoldCountdown(detail?.PayHoldMinutes);

  const showHoldBanner = useMemo(
    () => detail != null && shouldShowTrainOrderHoldBanner(payHoldSecondsRemaining, detail.Actions),
    [detail, payHoldSecondsRemaining],
  );

  const [selectedTicketIndex, setSelectedTicketIndex] = useState(0);
  const [billOpen, setBillOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundPassenger, setRefundPassenger] = useState<TrainPassengerInfo | undefined>();
  const [explainOpen, setExplainOpen] = useState(false);
  const [scheduleParams, setScheduleParams] = useState<TrainScheduleParams | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const scheduleQuery = useTrainSchedule(scheduleParams);

  const leaveDetail = useCallback(() => {
    navigate(ORDERS_TRAIN_FALLBACK, { replace: true });
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
    scrollH5MainToTopAfterLayout();
  }, [orderId, location.pathname]);

  useLayoutEffect(() => {
    if (!detail) return;
    scrollH5MainToTopAfterLayout();
  }, [detail?.OrderId, showHoldBanner]);

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

  useEffect(() => {
    setSelectedTicketIndex(0);
  }, [orderId]);

  useEffect(() => {
    if (!openCancelOnMountRef.current || !detail?.Actions?.showCancel) {
      return;
    }
    openCancelOnMountRef.current = false;
    setCancelOpen(true);
  }, [detail?.Actions?.showCancel]);

  const selectedTicket = useMemo(
    () => (detail ? getSelectedTicket(detail, selectedTicketIndex) : undefined),
    [detail, selectedTicketIndex],
  );

  const footerActions = useMemo(
    () => mergeTrainFooterActions(detail?.Actions, selectedTicket),
    [detail?.Actions, selectedTicket],
  );

  const billLines = useMemo(() => {
    if (!detail || !selectedTicket) return [];
    return filterBillLinesForTicket(
      detail.BillItems,
      selectedTicket.Key,
      detail.ShowServiceFee ?? true,
    );
  }, [detail, selectedTicket]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }, []);

  const handlePay = useCallback(() => {
    navigate(`/train/pay/${encodeURIComponent(orderId)}`);
  }, [navigate, orderId]);

  const runCancel = useCallback(async () => {
    if (!detail) return;
    try {
      await cancelMutation.mutateAsync({
        OrderId: detail.OrderId,
        Channel: resolveAppChannel(),
      });
      setCancelOpen(false);
      showToast("订单已取消");
      await refetch();
    } catch (err) {
      showToast(formatApiError(err));
    }
  }, [cancelMutation, detail, refetch, showToast]);

  const runIssue = useCallback(async () => {
    if (!detail) return;
    try {
      await issueMutation.mutateAsync({ OrderId: detail.OrderId });
      setIssueOpen(false);
      showToast("出票请求已提交");
      await refetch();
    } catch (err) {
      showToast(formatApiError(err));
    }
  }, [detail, issueMutation, refetch, showToast]);

  const openRefundDialog = useCallback(async () => {
    if (!selectedTicket) return;
    try {
      const passenger = await getApi().train.getTrainPassenger({
        TicketId: selectedTicket.Id,
      });
      setRefundPassenger(passenger);
      setRefundOpen(true);
    } catch (err) {
      showToast(formatApiError(err));
    }
  }, [selectedTicket, showToast]);

  useEffect(() => {
    if (!openRefundOnMountRef.current || !selectedTicket?.Actions?.showRefund) {
      return;
    }
    openRefundOnMountRef.current = false;
    void openRefundDialog();
  }, [openRefundDialog, selectedTicket?.Actions?.showRefund]);

  const runRefund = useCallback(async () => {
    if (!detail || !selectedTicket) return;
    try {
      await refundMutation.mutateAsync({
        OrderId: detail.OrderId,
        TicketId: selectedTicket.Id,
        Channel: resolveAppChannel(),
      });
      setRefundOpen(false);
      showToast("退票请求已提交");
      await refetch();
    } catch (err) {
      showToast(formatApiError(err));
    }
  }, [detail, refundMutation, refetch, selectedTicket, showToast]);

  const runExchange = useCallback(async () => {
    if (!selectedTicket) return;
    try {
      await startTrainExchangeFlow({
        ticketId: selectedTicket.Id,
        orderId: detail?.OrderId,
        navigate,
      });
    } catch (err) {
      showToast(formatApiError(err));
    }
  }, [detail?.OrderId, navigate, selectedTicket, showToast]);

  const showFooter = detail ? shouldShowTrainFooter(footerActions, payHoldSecondsRemaining) : false;
  const contentBottomPadding =
    showFooter && (footerActions.showRefund || footerActions.showExchange)
      ? FOOTER_OFFSET_WITH_SECONDARY
      : showFooter
        ? FOOTER_OFFSET
        : "1.5rem";
  const pending = cancelMutation.isPending || issueMutation.isPending || refundMutation.isPending;

  return (
    <div className="min-h-screen bg-[#F5F6F9]">
      <HotelOrderDetailHeader ref={headerRef} onBack={handleBack} />

      <div style={{ paddingTop: headerHeight }}>
        {showHoldBanner && payHoldSecondsRemaining != null ? (
          <TrainOrderHoldBanner
            payHoldSecondsRemaining={payHoldSecondsRemaining}
            actions={detail?.Actions}
          />
        ) : null}
        {isLoading ? (
          <p className="px-4 pt-3 text-center text-sm text-[#999999]">加载中…</p>
        ) : isError || !detail ? (
          <p className="px-4 pt-3 text-center text-sm text-[#FF4D4F]">
            {formatApiError(error ?? new Error("订单不存在"))}
          </p>
        ) : (
          <div className="space-y-3 px-4 pb-6 pt-3" style={{ paddingBottom: contentBottomPadding }}>
            <TrainOrderInfoCard
              detail={detail}
              transactionId={selectedTicket?.Id}
              outNumbers={selectedTicket?.Traveler?.OutNumbers}
              onShowBill={() => setBillOpen(true)}
            />

            <TrainOrderPassengerTabs
              tickets={detail.Tickets}
              selectedIndex={selectedTicketIndex}
              onSelect={setSelectedTicketIndex}
            />

            {selectedTicket ? (
              <>
                <TrainOrderJourneyCard
                  ticket={selectedTicket}
                  onShowExplain={() => setExplainOpen(true)}
                  onShowSchedule={() => {
                    const params = buildTrainScheduleParamsFromTrip(selectedTicket.Trips[0]);
                    if (params) setScheduleParams(params);
                  }}
                />
                <TrainOrderTravelerCard ticket={selectedTicket} />
              </>
            ) : null}

            <FlightOrderContactCard contact={detail.Contact} />

            <HotelOrderApprovalSection histories={detail.Histories ?? []} />
          </div>
        )}
      </div>

      {detail ? (
        <>
          <TrainOrderDetailFooter
            actions={footerActions}
            payHoldSecondsRemaining={payHoldSecondsRemaining}
            pending={pending}
            onCancel={() => setCancelOpen(true)}
            onPay={handlePay}
            onIssue={() => setIssueOpen(true)}
            onRefund={() => void openRefundDialog()}
            onExchange={() => void runExchange()}
          />

          <TrainOrderBillSheet
            open={billOpen}
            ticket={selectedTicket}
            lines={billLines}
            onClose={() => setBillOpen(false)}
          />

          <TrainOrderCancelDialog
            open={cancelOpen}
            pending={cancelMutation.isPending}
            onConfirm={() => void runCancel()}
            onClose={() => setCancelOpen(false)}
          />

          <TrainOrderIssueDialog
            open={issueOpen}
            pending={issueMutation.isPending}
            onConfirm={() => void runIssue()}
            onClose={() => setIssueOpen(false)}
          />

          <TrainOrderRefundDialog
            open={refundOpen}
            pending={refundMutation.isPending}
            passenger={refundPassenger}
            onConfirm={() => void runRefund()}
            onClose={() => setRefundOpen(false)}
          />

          <TrainOrderExplainSheet
            open={explainOpen}
            explain={selectedTicket?.Explain ?? selectedTicket?.Trips[0]?.Explain}
            onClose={() => setExplainOpen(false)}
          />

          <TrainScheduleSheet
            open={Boolean(scheduleParams)}
            title={scheduleParams ? `${scheduleParams.TrainCode} 经停站` : "经停站"}
            loading={scheduleQuery.isLoading}
            error={scheduleQuery.isError ? formatApiError(scheduleQuery.error) : null}
            stops={scheduleQuery.data?.Stops}
            fromStation={selectedTicket?.Trips[0]?.FromStationName}
            toStation={selectedTicket?.Trips[0]?.ToStationName}
            onClose={() => setScheduleParams(null)}
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
