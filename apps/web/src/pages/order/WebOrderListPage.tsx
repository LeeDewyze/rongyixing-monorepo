import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type {
  OrderAction,
  OrderFlightListItem,
  OrderFlightListTicket,
  OrderHotelListItem,
  OrderListItem,
  OrderListScope,
  OrderTrainListItem,
  OrderTrainListTicket,
  ProductChannel,
  TrainPassengerInfo,
} from "@ryx/shared-types";
import { OrderListTabId } from "@ryx/shared-types";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FlightOrderRefundDialog } from "@/components/order/flight/FlightOrderRefundDialog";
import {
  OrderCategoryTabs,
  OrderChannelTabs,
  OrderScopeTabs,
} from "@/components/order/OrderCategoryTabs";
import { TrainOrderRefundDialog } from "@/components/order/train/TrainOrderRefundDialog";
import { WebOrderListGrid } from "@/components/order/WebOrderListCard";
import { WebOrderToast } from "@/components/order/WebOrderDetailShell";
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
import {
  useAbolishTrainTicket,
  useCancelTrainOrder,
  useRefundTrainOrder,
} from "@/hooks/useTrainOrderDetail";
import { resolveAppChannel } from "@/lib/app-channel";
import { getApi } from "@/lib/api";
import { formatApiError } from "@/lib/formatApiError";
import { loadHomeTravelMode } from "@/lib/flight-travel-mode";
import { startFlightExchangeFlow } from "@/lib/flight-order-actions";
import { startTrainExchangeFlow } from "@/lib/train-order-actions";
import {
  buildOrderListSearchParams,
  CATEGORY_TO_TAB_ID,
  parseOrderListCategoryId,
  parseOrderListChannel,
  parseOrderListScope,
  resolveOrderTypeTab,
} from "@/lib/order-list-params";
import { withOrderChannel } from "@/lib/order-page-utils";
import { getOrderDetailPath, getOrderPayPath } from "@/lib/order-routes";
import type { OrderCategoryId, OrderTypeTab } from "@/config/order-assets";

type FlightListTicketState = { orderId: string; ticket: OrderFlightListTicket };
type TrainListTicketState = { orderId: string; ticket?: OrderTrainListTicket };

function resolveFlightActionTicket(item: OrderFlightListItem): OrderFlightListTicket | null {
  if (!item.TicketId) return null;
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
  if (!item.TicketId) return null;
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

export function WebOrderListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [refundTicket, setRefundTicket] = useState<FlightListTicketState | null>(null);
  const [refundKind, setRefundKind] = useState<"voluntary" | "nonVoluntary">("voluntary");
  const [cancelTicket, setCancelTicket] = useState<FlightListTicketState | null>(null);
  const [trainRefundTicket, setTrainRefundTicket] = useState<TrainListTicketState | null>(null);
  const [trainRefundPassenger, setTrainRefundPassenger] = useState<TrainPassengerInfo>();
  const [trainCancelTicket, setTrainCancelTicket] = useState<TrainListTicketState | null>(null);
  const [hotelCancelItem, setHotelCancelItem] = useState<OrderHotelListItem | null>(null);

  const categoryId = parseOrderListCategoryId(searchParams);
  const scope = parseOrderListScope(searchParams.get("scope"));
  const productChannel = parseOrderListChannel(searchParams, loadHomeTravelMode());
  const activeOrderTypeTab = resolveOrderTypeTab(productChannel, categoryId);
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
  } = useOrderList({ tabId, scope, channel: productChannel });

  const flightCancelMutation = useCancelFlightOrder();
  const flightRefundInfo = useFlightTicketRefundInfo(
    refundTicket && productChannel !== "tourist"
      ? { orderFlightTicket: refundTicket.ticket.TicketId, channel: productChannel }
      : null,
  );
  const flightRefundMutation = useRefundFlightOrder();
  const flightNonVoluntaryRefundMutation = useNonVoluntaryRefundFlightOrder();
  const trainCancelMutation = useCancelTrainOrder();
  const trainAbolishMutation = useAbolishTrainTicket();
  const trainRefundMutation = useRefundTrainOrder();
  const hotelCancelMutation = useCancelHotelOrder();

  const orders = useMemo(() => data?.pages.flatMap((page) => page.Orders) ?? [], [data?.pages]);
  const isInitialLoading = isLoading && orders.length === 0;

  useEffect(() => {
    const hasExplicitChannel = searchParams.get("channel") === productChannel;
    const hasCategory = searchParams.has("tab");
    const hasScope = searchParams.has("scope");
    const hasLegacyTabId = searchParams.has("tabId");
    if (hasExplicitChannel && hasCategory && hasScope && !hasLegacyTabId) return;
    const params = buildOrderListSearchParams(searchParams, {
      channel: productChannel,
      categoryId,
      scope,
    });
    setSearchParams(params, { replace: true });
  }, [categoryId, productChannel, scope, searchParams, setSearchParams]);

  const updateParams = useCallback(
    (next: { channel?: ProductChannel; tab?: OrderCategoryId; scope?: OrderListScope }) => {
      const params = buildOrderListSearchParams(searchParams, {
        channel: next.channel,
        categoryId: next.tab,
        scope: next.scope,
      });
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const handleOrderTypeChange = useCallback(
    (tab: OrderTypeTab) => updateParams({ channel: tab.channel, tab: tab.categoryId }),
    [updateParams],
  );

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const showToast = useCallback((message: string) => setToastMessage(message), []);

  const openTrainRefundDialog = useCallback(
    async (orderId: string, ticket: OrderTrainListTicket) => {
      try {
        const passenger = await getApi().train.getTrainPassenger({
          channel: productChannel,
          TicketId: ticket.TicketId,
        });
        setTrainRefundPassenger(passenger);
        setTrainRefundTicket({ orderId, ticket });
      } catch (err) {
        showToast(formatApiError(err));
      }
    },
    [productChannel, showToast],
  );

  const handleAction = useCallback(
    (action: OrderAction, item: OrderListItem) => {
      switch (action.kind) {
        case "pay":
          navigate(withOrderChannel(getOrderPayPath(item), productChannel, { scope }));
          return;
        case "cancel":
          if (item.tabId === OrderListTabId.Hotel) {
            const hotelItem = item as OrderHotelListItem;
            if (!hotelItem.OrderHotelId) {
              navigate(withOrderChannel(getOrderDetailPath(item), productChannel, { scope }), {
                state: { action: "cancel" },
              });
              return;
            }
            setHotelCancelItem(hotelItem);
            return;
          }
          if (item.tabId === OrderListTabId.Flight) {
            const ticket = resolveFlightActionTicket(item as OrderFlightListItem);
            if (!ticket) {
              showToast("无法获取客票信息");
              return;
            }
            setCancelTicket({ orderId: item.OrderId, ticket });
            return;
          }
          if (item.tabId === OrderListTabId.Train) {
            setTrainCancelTicket({
              orderId: item.OrderId,
              ticket: resolveTrainActionTicket(item as OrderTrainListItem) ?? undefined,
            });
            return;
          }
          showToast("功能即将上线");
          return;
        case "refund":
          if (item.tabId === OrderListTabId.Flight) {
            const ticket = resolveFlightActionTicket(item as OrderFlightListItem);
            if (!ticket) {
              showToast("无法获取客票信息");
              return;
            }
            setRefundKind("voluntary");
            setRefundTicket({ orderId: item.OrderId, ticket });
            return;
          }
          if (item.tabId === OrderListTabId.Train) {
            const ticket = resolveTrainActionTicket(item as OrderTrainListItem);
            if (!ticket) {
              showToast("无法获取车票信息");
              return;
            }
            void openTrainRefundDialog(item.OrderId, ticket);
            return;
          }
          showToast("功能即将上线");
          return;
        case "exchange":
          if (item.tabId === OrderListTabId.Flight) {
            const ticket = resolveFlightActionTicket(item as OrderFlightListItem);
            if (!ticket) {
              showToast("无法获取客票信息");
              return;
            }
            void startFlightExchangeFlow({
              channel: productChannel,
              ticketId: ticket.TicketId,
              orderId: item.OrderId,
              exchangeDate: ticket.DepartTime.slice(0, 10),
              navigate,
            }).catch((err) => showToast(formatApiError(err)));
            return;
          }
          if (item.tabId === OrderListTabId.Train) {
            const ticket = resolveTrainActionTicket(item as OrderTrainListItem);
            if (!ticket) {
              showToast("无法获取车票信息");
              return;
            }
            void startTrainExchangeFlow({
              channel: productChannel,
              ticketId: ticket.TicketId,
              orderId: item.OrderId,
              navigate,
            }).catch((err) => showToast(formatApiError(err)));
            return;
          }
          showToast("功能即将上线");
          return;
        default:
          showToast("功能即将上线");
      }
    },
    [navigate, openTrainRefundDialog, productChannel, scope, showToast],
  );

  const handleCardClick = useCallback(
    (item: OrderListItem) => {
      navigate(withOrderChannel(getOrderDetailPath(item), productChannel, { scope }));
    },
    [navigate, productChannel, scope],
  );

  const confirmFlightCancel = useCallback(async () => {
    if (!cancelTicket) return;
    try {
      await flightCancelMutation.mutateAsync({
        mode: "ticket",
        params: {
          channel: productChannel,
          OrderId: cancelTicket.orderId,
          TicketId: cancelTicket.ticket.TicketId,
          Tag: "flight",
        },
      });
      setCancelTicket(null);
      showToast("订单已取消");
      void refresh();
    } catch (err) {
      showToast(formatApiError(err));
    }
  }, [cancelTicket, flightCancelMutation, productChannel, refresh, showToast]);

  const confirmFlightRefund = useCallback(async () => {
    if (!refundTicket) return;
    try {
      if (refundKind === "nonVoluntary") {
        const result = await flightNonVoluntaryRefundMutation.mutateAsync({
          channel: productChannel,
          OrderFlightTicketId: refundTicket.ticket.TicketId,
          OrderId: refundTicket.orderId,
          IsVoluntary: false,
        });
        showToast(result?.Message || "退票申请中");
      } else {
        await flightRefundMutation.mutateAsync({
          channel: productChannel,
          orderId: refundTicket.orderId,
          ticketId: refundTicket.ticket.TicketId,
          IsVoluntary: true,
        });
        showToast("退票申请中");
      }
      setRefundTicket(null);
      void refresh();
    } catch (err) {
      showToast(formatApiError(err));
    }
  }, [
    flightNonVoluntaryRefundMutation,
    flightRefundMutation,
    productChannel,
    refresh,
    refundKind,
    refundTicket,
    showToast,
  ]);

  const confirmTrainCancel = useCallback(async () => {
    if (!trainCancelTicket) return;
    try {
      if (trainCancelTicket.ticket?.TicketId) {
        await trainAbolishMutation.mutateAsync({
          channel: productChannel,
          OrderId: trainCancelTicket.orderId,
          TicketId: trainCancelTicket.ticket.TicketId,
          Tag: "train",
          Channel: resolveAppChannel(),
        });
      } else {
        await trainCancelMutation.mutateAsync({
          channel: productChannel,
          OrderId: trainCancelTicket.orderId,
          Channel: resolveAppChannel(),
        });
      }
      setTrainCancelTicket(null);
      showToast("订单已取消");
      void refresh();
    } catch (err) {
      showToast(formatApiError(err));
    }
  }, [
    productChannel,
    refresh,
    showToast,
    trainAbolishMutation,
    trainCancelMutation,
    trainCancelTicket,
  ]);

  const confirmTrainRefund = useCallback(async () => {
    if (!trainRefundTicket?.ticket) return;
    try {
      await trainRefundMutation.mutateAsync({
        channel: productChannel,
        OrderId: trainRefundTicket.orderId,
        TicketId: trainRefundTicket.ticket.TicketId,
        Channel: resolveAppChannel(),
      });
      setTrainRefundTicket(null);
      setTrainRefundPassenger(undefined);
      showToast("退票请求已提交");
      void refresh();
    } catch (err) {
      showToast(formatApiError(err));
    }
  }, [productChannel, refresh, showToast, trainRefundMutation, trainRefundTicket]);

  const confirmHotelCancel = useCallback(async () => {
    if (!hotelCancelItem?.OrderHotelId) return;
    try {
      await hotelCancelMutation.mutateAsync({
        channel: productChannel,
        OrderId: hotelCancelItem.OrderId,
        OrderHotelId: hotelCancelItem.OrderHotelId,
        Channel: resolveAppChannel(),
      });
      setHotelCancelItem(null);
      showToast("酒店订单已取消");
      void refresh();
    } catch (err) {
      showToast(formatApiError(err));
    }
  }, [hotelCancelItem, hotelCancelMutation, productChannel, refresh, showToast]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2000);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  return (
    <div className={`h-full overflow-y-auto bg-[#F5F6F9] ${ORDER_FONT}`}>
      <header className="sticky top-0 z-20">
        <div
          className="order-list-header--embedded overflow-visible"
          style={{
            backgroundColor: "#F5F6F9",
            backgroundImage: ORDER_HEADER_GRADIENT,
            backgroundRepeat: "no-repeat",
            backgroundSize: "100% 100%",
          }}
        >
          <div className="mx-auto flex w-full max-w-[1280px] items-center justify-end px-4 pb-1 pt-2">
            <OrderChannelTabs
              compact
              activeId={activeOrderTypeTab.id}
              onChange={handleOrderTypeChange}
            />
          </div>
          <div className="mx-auto w-full max-w-[1280px] px-4 pb-2">
            <OrderCategoryTabs activeId={activeOrderTypeTab.id} onChange={handleOrderTypeChange} />
          </div>
        </div>
        <div
          className={`order-scope-shell relative z-0 px-4 pb-2.5 pt-3${
            activeOrderTypeTab.channel === "tourist" ? " order-scope-shell--tourist" : ""
          }`}
          style={{
            background: ORDER_SCOPE_TABS_SHELL_GRADIENT,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }}
        >
          <div className="mx-auto w-full max-w-[1280px]">
            <OrderScopeTabs scope={scope} onChange={(next) => updateParams({ scope: next })} />
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1280px] px-4 py-3">
        <WebOrderListGrid
          orders={orders}
          scope={scope}
          isLoading={isInitialLoading}
          isLoadingMore={isFetchingNextPage}
          errorMessage={isError ? formatApiError(error) : undefined}
          onAction={handleAction}
          onCardClick={handleCardClick}
          onLoadMore={handleLoadMore}
          hasMore={Boolean(hasNextPage)}
        />
      </div>

      <WebOrderToast message={toastMessage} />

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
          orderId={trainRefundTicket.orderId}
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
          loading={trainCancelMutation.isPending || trainAbolishMutation.isPending}
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
