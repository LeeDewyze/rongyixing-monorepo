import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { OrderListTabId, type OrderListScope } from "@ryx/shared-types";

import { getApi } from "@/lib/api";

export const ORDER_LIST_PAGE_SIZE = 20;

export const orderListQueryKey = (tabId: OrderListTabId | null, scope: OrderListScope) =>
  ["order", "list", tabId, scope] as const;

export interface UseOrderListParams {
  tabId: OrderListTabId | null;
  scope: OrderListScope;
}

function getNextPageIndex(
  orders: { length: number } | undefined,
  totalCount: number | undefined,
  pageParam: number,
): number | undefined {
  const pageOrders = orders ?? [];
  if (totalCount != null) {
    const loaded = (pageParam + 1) * ORDER_LIST_PAGE_SIZE;
    return loaded < totalCount ? pageParam + 1 : undefined;
  }
  return pageOrders.length >= ORDER_LIST_PAGE_SIZE ? pageParam + 1 : undefined;
}

export function useOrderList({ tabId, scope }: UseOrderListParams, enabled = true) {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: orderListQueryKey(tabId, scope),
    queryFn: ({ pageParam = 0 }) =>
      getApi().order.getList({
        TabId: tabId!,
        Scope: scope,
        PageIndex: pageParam,
        PageSize: ORDER_LIST_PAGE_SIZE,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, pageParam) =>
      getNextPageIndex(lastPage?.Orders, lastPage?.TotalCount, pageParam),
    enabled: enabled && tabId != null,
  });

  const refresh = useCallback(async () => {
    await queryClient.resetQueries({
      queryKey: orderListQueryKey(tabId, scope),
      exact: true,
    });
  }, [queryClient, scope, tabId]);

  return { ...query, refresh };
}
