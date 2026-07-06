import { useEffect, useRef } from "react";
import type { OrderAction, OrderListItem, OrderListScope } from "@ryx/shared-types";

import { OrderEmptyState } from "@/components/order/OrderEmptyState";
import { OrderListCard } from "@/components/order/OrderListCard";
import { ORDER_FONT } from "@/config/order-assets";

function WebOrderListSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="w-full animate-pulse rounded-[8px] bg-white p-3">
          <div className="flex items-center gap-2">
            <div className="size-5 rounded bg-[#E5E7EB]" />
            <div className="h-4 flex-1 rounded bg-[#E5E7EB]" />
            <div className="h-4 w-12 rounded bg-[#E5E7EB]" />
          </div>
          <div className="mt-3 h-24 rounded-[8px] bg-[#E5E7EB]" />
          <div className="mt-3 flex justify-between">
            <div className="h-6 w-16 rounded bg-[#E5E7EB]" />
            <div className="h-8 w-28 rounded-full bg-[#E5E7EB]" />
          </div>
        </div>
      ))}
    </>
  );
}

interface WebOrderListGridProps {
  orders: OrderListItem[];
  scope?: OrderListScope;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  errorMessage?: string;
  onAction?: (action: OrderAction, item: OrderListItem) => void;
  onCardClick?: (item: OrderListItem) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

function useInfiniteScrollSentinel(onLoadMore: (() => void) | undefined, enabled: boolean) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !onLoadMore) return;
    const target = sentinelRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore();
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [enabled, onLoadMore]);

  return sentinelRef;
}

export function WebOrderListGrid({
  orders,
  scope = "all",
  isLoading,
  isLoadingMore,
  errorMessage,
  onAction,
  onCardClick,
  onLoadMore,
  hasMore,
}: WebOrderListGridProps) {
  const sentinelRef = useInfiniteScrollSentinel(onLoadMore, Boolean(hasMore));
  const showPrice = scope !== "pendingTravel";

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 pad:grid-cols-3">
        <WebOrderListSkeleton />
      </div>
    );
  }

  if (errorMessage) {
    return <p className="py-12 text-center text-sm text-[#FF4D4F]">{errorMessage}</p>;
  }

  if (orders.length === 0) {
    return (
      <div className="py-16">
        <OrderEmptyState />
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-3 pad:grid-cols-3">
        {orders.map((item) => (
          <OrderListCard
            key={item.OrderId}
            item={item}
            showPrice={showPrice}
            onAction={onAction}
            onCardClick={onCardClick}
          />
        ))}
      </div>
      {hasMore ? (
        <div
          ref={sentinelRef}
          className={`flex h-12 items-center justify-center text-sm text-[#9CA3AF] ${ORDER_FONT}`}
        >
          {isLoadingMore ? "加载中…" : null}
        </div>
      ) : null}
    </>
  );
}
