import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { OrderAction, OrderListScope } from "@ryx/shared-types";

import {
  OrderCategoryTabs,
  OrderScopeTabs,
  type OrderCategoryId,
} from "@/components/order/OrderCategoryTabs";
import { OrderList } from "@/components/order/OrderList";
import { usePageHeader } from "@/components/layout";
import { ORDER_HEADER_GRADIENT } from "@/config/order-assets";
import { useOrderList } from "@/hooks/useOrderList";
import { formatApiError } from "@/lib/formatApiError";
import {
  CATEGORY_TO_TAB_ID,
  parseOrderListCategoryId,
  parseOrderListScope,
  TAB_ID_TO_PARAM,
} from "@/lib/order-list-params";

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

export function OrderListPage({ embeddedInTab = false }: OrderListPageProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(FALLBACK_HEADER_HEIGHT);
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);

  const categoryId = parseOrderListCategoryId(searchParams);
  const scope = parseOrderListScope(searchParams.get("scope"));
  const tabId = CATEGORY_TO_TAB_ID[categoryId];

  const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useOrderList({ tabId, scope });

  const orders = useMemo(() => data?.pages.flatMap((page) => page.Orders) ?? [], [data?.pages]);
  const isInitialLoading = isLoading && orders.length === 0;

  usePageHeader({ visible: false });

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

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
        <div style={{ background: ORDER_HEADER_GRADIENT }}>
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
