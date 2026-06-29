import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import type {
  OrderAction,
  OrderFlightListItem,
  OrderFlightListTicket,
  OrderHotelListItem,
  OrderListItem,
  OrderListScope,
  OrderTrainListItem,
  OrderTrainListTicket,
  TrainPassengerInfo,
} from "@ryx/shared-types";
import { OrderListTabId } from "@ryx/shared-types";

import {
  OrderCategoryTabs,
  OrderScopeTabs,
  orderCategoryPointerLeft,
  type OrderCategoryId,
} from "@/components/order/OrderCategoryTabs";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FlightOrderRefundDialog } from "@/components/order/flight/FlightOrderRefundDialog";
import { OrderList } from "@/components/order/OrderList";
import { TrainOrderRefundDialog } from "@/components/order/train/TrainOrderRefundDialog";
import { usePageHeader } from "@/components/layout";
import {
  ORDER_FONT,
  ORDER_HEADER_GRADIENT,
  ORDER_SCOPE_TABS_SHELL_GRADIENT,
} from "@/config/order-assets";
import {
  useCancelFlightOrder,
  useFlightTicketRefundInfo,
  useNonVoluntaryRefundFlightOrder,
  useRefundFlightOrder,
} from "@/hooks/useFlightOrderDetail";
import { useCancelHotelOrder } from "@/hooks/useHotelOrderDetail";
import { useOrderList } from "@/hooks/useOrderList";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useCancelTrainOrder, useRefundTrainOrder } from "@/hooks/useTrainOrderDetail";
import { resolveAppChannel } from "@/lib/app-channel";
import { getApi } from "@/lib/api";
import { formatApiError } from "@/lib/formatApiError";
import { startTrainExchangeFlow } from "@/lib/train-order-actions";
import {
  CATEGORY_TO_TAB_ID,
  DEFAULT_ORDER_CATEGORY,
  parseOrderListCategoryId,
  parseOrderListScope,
  TAB_ID_TO_PARAM,
} from "@/lib/order-list-params";
import { getOrderDetailPath, getOrderPayPath } from "@/lib/order-routes";

const FALLBACK_HEADER_HEIGHT = 84;

function BackIcon() {
  return (
    <svg viewBox="0 0 10 17" className="h-[17px] w-[10px] shrink-0 text-black" aria-hidden>
      <path
        d="M9 1.5 2.5 8.5 9 15.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface OrderListPageProps {
  /** Renders inside TabLayout without a back button. */
  embeddedInTab?: boolean;
}

interface OrdersLocationState {
  bookedOrderId?: string;
  product?: string;
}

type FlightListTicketState = {
  orderId: string;
  ticket: OrderFlightListTicket;
};

type TrainListTicketState = {
  orderId: string;
  ticket?: OrderTrainListTicket;
};

function resolveFlightActionTicket(item: OrderFlightListItem): OrderFlightListTicket | null {
  if (!item.TicketId) {
    return null;
  }
  return (
    item.Tickets?.find((ticket) => ticket.TicketId === item.TicketId) ?? {
      TicketId: item.TicketId,
      RouteTitle: item.RouteTitle,
      DepartTime: item.DepartTime,
      PassengerNames: item.PassengerNames,
      TicketStatusName: item.TicketStatusName,
      Actions: item.Actions,
    }
  );
}

function resolveTrainActionTicket(item: OrderTrainListItem): OrderTrainListTicket | null {
  if (!item.TicketId) {
    return null;
  }
  return (
    item.Tickets?.find((ticket) => ticket.TicketId === item.TicketId) ?? {
      TicketId: item.TicketId,
      RouteTitle: item.RouteTitle,
      DepartTime: item.DepartTime,
      PassengerNames: item.PassengerNames,
      TicketStatusName: item.TicketStatusName,
      Actions: item.Actions,
    }
  );
}

export function OrderListPage({ embeddedInTab = false }: OrderListPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [refundTicket, setRefundTicket] = useState<FlightListTicketState | null>(null);
  const [refundKind, setRefundKind] = useState<"voluntary" | "nonVoluntary">("voluntary");
  const [cancelTicket, setCancelTicket] = useState<FlightListTicketState | null>(null);
  const [trainRefundTicket, setTrainRefundTicket] = useState<TrainListTicketState | null>(null);
  const [trainRefundPassenger, setTrainRefundPassenger] = useState<TrainPassengerInfo>();
  const [trainCancelTicket, setTrainCancelTicket] = useState<TrainListTicketState | null>(null);
  const [hotelCancelItem, setHotelCancelItem] = useState<OrderHotelListItem | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [headerHeight, setHeaderHeight] = useState(FALLBACK_HEADER_HEIGHT);
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);

  const categoryId = parseOrderListCategoryId(searchParams);
  const scope = parseOrderListScope(searchParams.get("scope"));
  const tabId = CATEGORY_TO_TAB_ID[categoryId];

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refresh,
  } = useOrderList({ tabId, scope });
  const flightCancelMutation = useCancelFlightOrder();
  const flightRefundInfo = useFlightTicketRefundInfo(
    refundTicket ? { orderFlightTicket: refundTicket.ticket.TicketId } : null,
  );
  const flightRefundMutation = useRefundFlightOrder();
  const flightNonVoluntaryRefundMutation = useNonVoluntaryRefundFlightOrder();
  const trainCancelMutation = useCancelTrainOrder();
  const trainRefundMutation = useRefundTrainOrder();
  const hotelCancelMutation = useCancelHotelOrder();

  const orders = useMemo(() => data?.pages.flatMap((page) => page.Orders) ?? [], [data?.pages]);
  const isInitialLoading = isLoading && orders.length === 0;

  usePageHeader({ visible: false });

  useEffect(() => {
    const hasCategory = searchParams.has("tab") || searchParams.has("tabId");
    if (hasCategory) {
      return;
    }
    const params = new URLSearchParams(searchParams);
    params.set("tab", TAB_ID_TO_PARAM[DEFAULT_ORDER_CATEGORY]);
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleScrollRoot = useCallback((node: HTMLDivElement | null) => {
    scrollRef.current = node;
    setScrollRoot(node);
  }, []);

  const { pullDistance, statusLabel, isActive } = usePullToRefresh({
    scrollRef,
    scrollElement: scrollRoot,
    onRefresh: refresh,
    disabled: isInitialLoading,
  });

  const updateParams = useCallback(
    (next: { tab?: OrderCategoryId; scope?: OrderListScope }) => {
      const params = new URLSearchParams(searchParams);
      params.delete("tabId");
      if (next.tab) {
        params.set("tab", TAB_ID_TO_PARAM[next.tab]);
      }
      if (next.scope) {
        params.set("scope", next.scope);
      }
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const openTrainRefundDialog = useCallback(
    async (orderId: string, ticket: OrderTrainListTicket) => {
      try {
        const passenger = await getApi().train.getTrainPassenger({
          TicketId: ticket.TicketId,
        });
        setTrainRefundPassenger(passenger);
        setTrainRefundTicket({ orderId, ticket });
      } catch (error) {
        setToastMessage(formatApiError(error));
      }
    },
    [],
  );

  const handleAction = useCallback(
    (action: OrderAction, item: OrderListItem) => {
      switch (action.kind) {
        case "pay":
          navigate(getOrderPayPath(item));
          return;
        case "cancel":
          if (item.tabId === OrderListTabId.Hotel) {
            const hotelItem = item as OrderHotelListItem;
            if (!hotelItem.OrderHotelId) {
              navigate(`/orders/hotel/${encodeURIComponent(item.OrderId)}`, {
                state: { action: "cancel" },
              });
              return;
            }
            setHotelCancelItem(hotelItem);
            return;
          }
          if (item.tabId === OrderListTabId.Flight) {
            const flightItem = item as OrderFlightListItem;
            const ticket = resolveFlightActionTicket(flightItem);
            if (!ticket) {
              setToastMessage("无法获取客票信息");
              return;
            }
            setCancelTicket({ orderId: flightItem.OrderId, ticket });
            return;
          }
          if (item.tabId === OrderListTabId.Train) {
            const trainItem = item as OrderTrainListItem;
            setTrainCancelTicket({
              orderId: trainItem.OrderId,
              ticket: resolveTrainActionTicket(trainItem) ?? undefined,
            });
            return;
          }
          setToastMessage("功能即将上线");
          return;
        case "refund":
          if (item.tabId === OrderListTabId.Flight) {
            const flightItem = item as OrderFlightListItem;
            const ticket = resolveFlightActionTicket(flightItem);
            if (!ticket) {
              setToastMessage("无法获取客票信息");
              return;
            }
            setRefundKind("voluntary");
            setRefundTicket({ orderId: flightItem.OrderId, ticket });
            return;
          }
          if (item.tabId === OrderListTabId.Train) {
            const trainItem = item as OrderTrainListItem;
            const ticket = resolveTrainActionTicket(trainItem);
            if (!ticket) {
              setToastMessage("无法获取车票信息");
              return;
            }
            void openTrainRefundDialog(trainItem.OrderId, ticket);
            return;
          }
          setToastMessage("功能即将上线");
          return;
        case "exchange":
          if (item.tabId === OrderListTabId.Flight) {
            setToastMessage("机票改签即将上线");
            return;
          }
          if (item.tabId === OrderListTabId.Train) {
            const trainItem = item as OrderTrainListItem;
            const ticket = resolveTrainActionTicket(trainItem);
            if (!ticket) {
              setToastMessage("无法获取车票信息");
              return;
            }
            void startTrainExchangeFlow({
              ticketId: ticket.TicketId,
              orderId: trainItem.OrderId,
              navigate,
            }).catch((error) => setToastMessage(formatApiError(error)));
            return;
          }
          setToastMessage("功能即将上线");
          return;
        default:
          setToastMessage("功能即将上线");
      }
    },
    [navigate, openTrainRefundDialog],
  );

  const handleCardClick = useCallback(
    (item: OrderListItem) => {
      navigate(getOrderDetailPath(item));
    },
    [navigate],
  );

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
  }, []);

  const confirmFlightCancel = useCallback(async () => {
    if (!cancelTicket) return;
    try {
      await flightCancelMutation.mutateAsync({
        mode: "ticket",
        params: {
          OrderId: cancelTicket.orderId,
          TicketId: cancelTicket.ticket.TicketId,
          Tag: "flight",
        },
      });
      setCancelTicket(null);
      showToast("订单已取消");
      void refresh();
    } catch (error) {
      showToast(formatApiError(error));
    }
  }, [cancelTicket, flightCancelMutation, refresh, showToast]);

  const confirmFlightRefund = useCallback(async () => {
    if (!refundTicket) return;
    try {
      if (refundKind === "nonVoluntary") {
        const result = await flightNonVoluntaryRefundMutation.mutateAsync({
          OrderFlightTicketId: refundTicket.ticket.TicketId,
          OrderId: refundTicket.orderId,
          IsVoluntary: false,
        });
        showToast(result?.Message || "退票申请中");
      } else {
        await flightRefundMutation.mutateAsync({
          orderId: refundTicket.orderId,
          ticketId: refundTicket.ticket.TicketId,
          IsVoluntary: true,
        });
        showToast("退票申请中");
      }
      setRefundTicket(null);
      void refresh();
    } catch (error) {
      showToast(formatApiError(error));
    }
  }, [
    flightNonVoluntaryRefundMutation,
    flightRefundMutation,
    refresh,
    refundKind,
    refundTicket,
    showToast,
  ]);

  const confirmTrainCancel = useCallback(async () => {
    if (!trainCancelTicket) return;
    try {
      await trainCancelMutation.mutateAsync({
        OrderId: trainCancelTicket.orderId,
        TicketId: trainCancelTicket.ticket?.TicketId,
        Channel: resolveAppChannel(),
      });
      setTrainCancelTicket(null);
      showToast("订单已取消");
      void refresh();
    } catch (error) {
      showToast(formatApiError(error));
    }
  }, [refresh, showToast, trainCancelMutation, trainCancelTicket]);

  const confirmTrainRefund = useCallback(async () => {
    if (!trainRefundTicket?.ticket) return;
    try {
      await trainRefundMutation.mutateAsync({
        OrderId: trainRefundTicket.orderId,
        TicketId: trainRefundTicket.ticket.TicketId,
        Channel: resolveAppChannel(),
      });
      setTrainRefundTicket(null);
      setTrainRefundPassenger(undefined);
      showToast("退票请求已提交");
      void refresh();
    } catch (error) {
      showToast(formatApiError(error));
    }
  }, [refresh, showToast, trainRefundMutation, trainRefundTicket]);

  const confirmHotelCancel = useCallback(async () => {
    if (!hotelCancelItem?.OrderHotelId) return;
    try {
      await hotelCancelMutation.mutateAsync({
        OrderId: hotelCancelItem.OrderId,
        OrderHotelId: hotelCancelItem.OrderHotelId,
        Channel: resolveAppChannel(),
      });
      setHotelCancelItem(null);
      showToast("酒店订单已取消");
      void refresh();
    } catch (error) {
      showToast(formatApiError(error));
    }
  }, [hotelCancelItem, hotelCancelMutation, refresh, showToast]);

  useEffect(() => {
    const state = location.state as OrdersLocationState | null;
    if (!state?.bookedOrderId) {
      return;
    }

    if (state.product === "flight") {
      const params = new URLSearchParams(searchParams);
      params.delete("tabId");
      params.set("tab", TAB_ID_TO_PARAM.flight);
      setSearchParams(params, { replace: true });
    }

    setToastMessage(`下单成功，订单号 ${state.bookedOrderId}`);
    navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
  }, [location.pathname, location.search, location.state, navigate, searchParams, setSearchParams]);

  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) {
      return;
    }

    const updateHeight = () => {
      setHeaderHeight(header.getBoundingClientRect().height);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, [embeddedInTab]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }
    const timer = window.setTimeout(() => setToastMessage(null), 2000);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const rootClassName = embeddedInTab
    ? "relative h-full min-h-0 overflow-hidden"
    : "relative h-dvh overflow-hidden bg-[#F5F6F9]";

  return (
    <div className={rootClassName}>
      <header ref={headerRef} className="fixed inset-x-0 top-0 z-30 w-full bg-[#F5F6F9]">
        <div
          style={{
            backgroundColor: "#F5F6F9",
            backgroundImage: ORDER_HEADER_GRADIENT,
            backgroundRepeat: "no-repeat",
            backgroundSize: "100% 100%",
          }}
          className={
            embeddedInTab
              ? "overflow-visible pt-[calc(env(safe-area-inset-top)+12px)]"
              : "overflow-visible"
          }
        >
          {!embeddedInTab ? (
            <div className="flex h-11 items-center px-3 pt-[env(safe-area-inset-top)]">
              <button
                type="button"
                className="flex h-11 w-10 shrink-0 items-center justify-center active:opacity-70"
                aria-label="返回"
                onClick={() => navigate(-1)}
              >
                <BackIcon />
              </button>
              <h1 className="pointer-events-none absolute inset-x-0 pt-[env(safe-area-inset-top)] text-center text-[17px] font-semibold leading-[44px] text-brand-title [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]">
                订单
              </h1>
            </div>
          ) : null}
          <OrderCategoryTabs activeId={categoryId} onChange={(id) => updateParams({ tab: id })} />
        </div>
        <div
          className="order-scope-shell relative z-0 flex h-[72px] items-center px-3"
          style={{
            background: ORDER_SCOPE_TABS_SHELL_GRADIENT,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            ["--order-category-pointer-left" as string]: orderCategoryPointerLeft(categoryId),
          }}
        >
          <OrderScopeTabs scope={scope} onChange={(next) => updateParams({ scope: next })} />
        </div>
      </header>

      <div
        ref={handleScrollRoot}
        className="h-full overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]"
        style={{ paddingTop: headerHeight }}
      >
        <div
          className={`flex items-end justify-center overflow-hidden text-sm text-[#9CA3AF] transition-[height] duration-200 ease-out ${ORDER_FONT} ${
            isActive ? "opacity-100" : "opacity-0"
          }`}
          style={{ height: isActive ? pullDistance : 0 }}
          aria-live="polite"
        >
          <span className="pb-2">{statusLabel}</span>
        </div>
        <OrderList
          orders={orders}
          isLoading={isInitialLoading}
          isLoadingMore={isFetchingNextPage}
          errorMessage={isError ? formatApiError(error) : undefined}
          onAction={handleAction}
          onCardClick={handleCardClick}
          onLoadMore={handleLoadMore}
          hasMore={Boolean(hasNextPage)}
          scrollRoot={scrollRoot}
        />
      </div>

      {toastMessage ? (
        <div
          className="pointer-events-none fixed inset-x-0 top-1/2 z-50 flex justify-center px-6"
          role="status"
          aria-live="polite"
        >
          <span className="rounded-lg bg-black/75 px-4 py-2 text-sm text-white">
            {toastMessage}
          </span>
        </div>
      ) : null}

      {refundTicket ? (
        <FlightOrderRefundDialog
          open
          refundInfo={flightRefundInfo.data}
          loading={flightRefundInfo.isLoading}
          error={flightRefundInfo.error}
          selectedKind={refundKind}
          pending={flightRefundMutation.isPending || flightNonVoluntaryRefundMutation.isPending}
          onKindChange={setRefundKind}
          onConfirm={() => void confirmFlightRefund()}
          onClose={() => setRefundTicket(null)}
        />
      ) : null}

      {cancelTicket ? (
        <ConfirmDialog
          open
          title="取消预订"
          message={`是否取消客票「${cancelTicket.ticket.PassengerNames || cancelTicket.ticket.RouteTitle}」？`}
          confirmLabel="是"
          cancelLabel="否"
          loading={flightCancelMutation.isPending}
          onConfirm={() => void confirmFlightCancel()}
          onCancel={() => setCancelTicket(null)}
        />
      ) : null}

      {trainRefundTicket ? (
        <TrainOrderRefundDialog
          open
          pending={trainRefundMutation.isPending}
          passenger={trainRefundPassenger}
          onConfirm={() => void confirmTrainRefund()}
          onClose={() => {
            setTrainRefundTicket(null);
            setTrainRefundPassenger(undefined);
          }}
        />
      ) : null}

      {trainCancelTicket ? (
        <ConfirmDialog
          open
          title="取消火车票"
          message={
            trainCancelTicket.ticket
              ? `是否取消「${trainCancelTicket.ticket.PassengerNames || trainCancelTicket.ticket.RouteTitle}」的火车票？`
              : "是否取消该火车票订单？"
          }
          confirmLabel="是"
          cancelLabel="否"
          loading={trainCancelMutation.isPending}
          onConfirm={() => void confirmTrainCancel()}
          onCancel={() => setTrainCancelTicket(null)}
        />
      ) : null}

      {hotelCancelItem ? (
        <ConfirmDialog
          open
          title="取消酒店订单"
          message={`确定要取消「${hotelCancelItem.HotelName || "该酒店"}」订单吗？`}
          confirmLabel="确认取消"
          cancelLabel="再想想"
          loading={hotelCancelMutation.isPending}
          onConfirm={() => void confirmHotelCancel()}
          onCancel={() => setHotelCancelItem(null)}
        />
      ) : null}
    </div>
  );
}
