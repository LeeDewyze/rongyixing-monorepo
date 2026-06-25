import { useEffect, useRef } from "react";
import type { OrderAction, OrderListItem } from "@ryx/shared-types";

import { ORDER_FONT } from "@/config/order-assets";

import { OrderEmptyState } from "./OrderEmptyState";
import { OrderListCard } from "./OrderListCard";

interface OrderListProps {
  orders: OrderListItem[];
  isLoading?: boolean;
  isLoadingMore?: boolean;
  errorMessage?: string;
  onAction?: (action: OrderAction, item: OrderListItem) => void;
  onCardClick?: (item: OrderListItem) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  scrollRoot?: HTMLElement | null;
}

function useInfiniteScrollTrigger(
  onLoadMore: (() => void) | undefined,
  enabled: boolean,
  scrollRoot: HTMLElement | null | undefined,
) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !onLoadMore) {
      return;
    }

    const target = sentinelRef.current;
    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { root: scrollRoot ?? null, rootMargin: "160px 0px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [enabled, onLoadMore, scrollRoot]);

  return sentinelRef;
}

function OrderListSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-3">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="w-full rounded-[8px] bg-white p-3">
          <div className="flex items-center gap-2">
            <div className="size-8 animate-pulse rounded-lg bg-[#E5E7EB]" />
            <div className="h-4 flex-1 animate-pulse rounded bg-[#E5E7EB]" />
            <div className="h-4 w-12 animate-pulse rounded bg-[#E5E7EB]" />
          </div>
          <div className="mt-3 h-24 animate-pulse rounded-lg bg-[#E5E7EB]" />
          <div className="mt-3 flex justify-between">
            <div className="h-6 w-16 animate-pulse rounded bg-[#E5E7EB]" />
            <div className="h-8 w-28 animate-pulse rounded-full bg-[#E5E7EB]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function OrderList({
  orders,
  isLoading,
  isLoadingMore,
  errorMessage,
  onAction,
  onCardClick,
  onLoadMore,
  hasMore,
  scrollRoot,
}: OrderListProps) {
  const sentinelRef = useInfiniteScrollTrigger(onLoadMore, Boolean(hasMore), scrollRoot);

  if (isLoading) {
    return <OrderListSkeleton />;
  }

  if (errorMessage) {
    return <p className="px-4 py-8 text-center text-sm text-[#FF4D4F]">{errorMessage}</p>;
  }

  if (orders.length === 0) {
    return <OrderEmptyState />;
  }

  return (
    <div className="flex flex-col gap-3 px-3 pb-4">
      {orders.map((item) => (
        <OrderListCard
          key={item.OrderId}
          item={item}
          onAction={onAction}
          onCardClick={onCardClick}
        />
      ))}

      {hasMore ? (
        <div
          ref={sentinelRef}
          className={`flex h-10 items-center justify-center text-sm text-[#9CA3AF] ${ORDER_FONT}`}
          aria-hidden={!isLoadingMore}
        >
          {isLoadingMore ? "加载中…" : null}
        </div>
      ) : null}
    </div>
  );
}
