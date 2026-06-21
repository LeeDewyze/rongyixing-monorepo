import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { OrderListTabId, type OrderAction, type OrderListScope } from "@ryx/shared-types";

import {
  OrderCategoryTabs,
  OrderScopeTabs,
  type OrderCategoryId,
} from "@/components/order/OrderCategoryTabs";
import { OrderList } from "@/components/order/OrderList";
import { ORDER_CATEGORY_TABS, ORDER_HEADER_GRADIENT } from "@/config/order-assets";
import { useOrderList } from "@/hooks/useOrderList";
import { formatApiError } from "@/lib/formatApiError";

const TAB_PARAM_TO_ID: Record<string, OrderCategoryId> = {
  flight: "flight",
  train: "train",
  hotel: "hotel",
  car: "car",
};

const TAB_ID_TO_PARAM: Record<OrderCategoryId, string> = {
  flight: "flight",
  train: "train",
  hotel: "hotel",
  car: "car",
};

const CATEGORY_TO_TAB_ID: Record<OrderCategoryId, OrderListTabId> = {
  flight: OrderListTabId.Flight,
  train: OrderListTabId.Train,
  hotel: OrderListTabId.Hotel,
  car: OrderListTabId.Car,
};

function parseCategoryId(value: string | null): OrderCategoryId {
  if (value && value in TAB_PARAM_TO_ID) {
    return TAB_PARAM_TO_ID[value]!;
  }
  return "hotel";
}

function parseScope(value: string | null): OrderListScope {
  return value === "pendingTravel" ? "pendingTravel" : "all";
}

const FALLBACK_HEADER_HEIGHT = 84;

export function TripsTabPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(FALLBACK_HEADER_HEIGHT);
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);

  const categoryId = parseCategoryId(searchParams.get("tab"));
  const scope = parseScope(searchParams.get("scope"));
  const tabId = CATEGORY_TO_TAB_ID[categoryId];

  const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useOrderList({ tabId, scope });

  const orders = useMemo(() => data?.pages.flatMap((page) => page.Orders) ?? [], [data?.pages]);
  const isInitialLoading = isLoading && orders.length === 0;

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const updateParams = useCallback(
    (next: { tab?: OrderCategoryId; scope?: OrderListScope }) => {
      const params = new URLSearchParams(searchParams);
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

  const handleAction = useCallback((_action: OrderAction) => {
    setToastMessage("功能即将上线");
  }, []);

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
  }, []);

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

  return (
    <div className="relative h-full min-h-0 overflow-hidden">
      <header
        ref={headerRef}
        className="fixed inset-x-0 top-0 z-30 mx-auto w-full max-w-lg bg-[#F5F6F9]"
      >
        <div style={{ background: ORDER_HEADER_GRADIENT }}>
          <OrderCategoryTabs activeId={categoryId} onChange={(id) => updateParams({ tab: id })} />
          <OrderScopeTabs scope={scope} onChange={(next) => updateParams({ scope: next })} />
        </div>
      </header>

      <div
        ref={setScrollRoot}
        className="h-full overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]"
        style={{ paddingTop: headerHeight }}
      >
        <OrderList
          orders={orders}
          isLoading={isInitialLoading}
          isLoadingMore={isFetchingNextPage}
          errorMessage={isError ? formatApiError(error) : undefined}
          onAction={handleAction}
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

/** Maps tab id to category label for tests or deep links. */
export function getOrderCategoryLabel(id: OrderCategoryId): string {
  return ORDER_CATEGORY_TABS.find((t) => t.id === id)?.label ?? "";
}
