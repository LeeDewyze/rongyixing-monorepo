import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { OrderApprovalTaskType } from "@ryx/shared-types";

import { getApi } from "@/lib/api";
import { fetchMyTravelApplications } from "@/lib/travel-form-list";
import { getTicket } from "@/lib/session";

const PAGE_SIZE = 20;

export function useOrderApprovalTasks(type: OrderApprovalTaskType) {
  return useInfiniteQuery({
    queryKey: ["approval", "order-tasks", type],
    queryFn: ({ pageParam }) =>
      getApi().approval.getOrderTasks({
        type,
        pageIndex: pageParam,
        pageSize: PAGE_SIZE,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.length >= PAGE_SIZE ? lastPageParam + 1 : undefined,
  });
}

/** Legacy workflow Form/List — travel applications submitted by current user. */
export function useMyTravelApplications() {
  return useQuery({
    queryKey: ["approval", "my-applications"],
    queryFn: async () => {
      const ticket = getTicket();
      if (!ticket) return [];
      return fetchMyTravelApplications(ticket);
    },
  });
}

export function useWaitingTaskCount() {
  return useQuery({
    queryKey: ["approval", "waiting-count"],
    queryFn: () => getApi().approval.getWaitingTaskCount(),
    staleTime: 60_000,
  });
}
