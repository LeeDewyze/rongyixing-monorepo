import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import type { OrderAction, OrderListItem, OrderListScope, OrderTrainListItem } from "@ryx/shared-types";
import { OrderListTabId } from "@ryx/shared-types";

import {
  OrderCategoryTabs,
  OrderScopeTabs,
  type OrderCategoryId,
} from "@/components/order/OrderCategoryTabs";
import { OrderList } from "@/components/order/OrderList";
import { usePageHeader } from "@/components/layout";
import { ORDER_FONT, ORDER_HEADER_GRADIENT } from "@/config/order-assets";
import { useOrderList } from "@/hooks/useOrderList";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
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

export function OrderListPage({ embeddedInTab = false }: OrderListPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
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

  const handleAction = useCallback(
    (action: OrderAction, item: OrderListItem) => {
      switch (action.kind) {
        case "pay":
          navigate(getOrderPayPath(item));
          return;
        case "cancel":
          if (item.tabId === OrderListTabId.Hotel) {
            navigate(`/orders/hotel/${encodeURIComponent(item.OrderId)}`, {
              state: { action: "cancel" },
            });
            return;
          }
          if (item.tabId === OrderListTabId.Flight) {
            navigate(`/orders/flight/${encodeURIComponent(item.OrderId)}`, {
              state: { action: "cancel" },
            });
            return;
          }
          if (item.tabId === OrderListTabId.Train) {
            navigate(`/orders/train/${encodeURIComponent(item.OrderId)}`, {
              state: { action: "cancel" },
            });
            return;
          }
          setToastMessage("功能即将上线");
          return;
        case "refund":
          if (item.tabId === OrderListTabId.Train) {
            navigate(`/orders/train/${encodeURIComponent(item.OrderId)}`, {
              state: { action: "refund" },
            });
            return;
          }
          setToastMessage("功能即将上线");
          return;
        case "exchange":
          if (item.tabId === OrderListTabId.Train) {
            const trainItem = item as OrderTrainListItem;
            if (!trainItem.TicketId) {
              setToastMessage("无法获取车票信息");
              return;
            }
            void startTrainExchangeFlow({
              ticketId: trainItem.TicketId,
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
    [navigate],
  );

  const handleCardClick = useCallback(
    (item: OrderListItem) => {
      navigate(getOrderDetailPath(item));
    },
    [navigate],
  );

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
      <header
        ref={headerRef}
        className="fixed inset-x-0 top-0 z-30 mx-auto w-full max-w-lg bg-[#F5F6F9]"
      >
        <div
          style={{
            backgroundColor: "#F5F6F9",
            backgroundImage: ORDER_HEADER_GRADIENT,
            backgroundRepeat: "no-repeat",
            backgroundSize: "100% 100%",
          }}
          className={embeddedInTab ? "pt-[calc(env(safe-area-inset-top)+12px)]" : undefined}
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
              <h1 className="pointer-events-none absolute inset-x-0 pt-[env(safe-area-inset-top)] text-center text-[17px] font-semibold leading-[44px] text-[#010101] [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]">
                订单
              </h1>
            </div>
          ) : null}
          <OrderCategoryTabs activeId={categoryId} onChange={(id) => updateParams({ tab: id })} />
        </div>
        <div className="bg-[#F5F6F9]">
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
    </div>
  );
}
