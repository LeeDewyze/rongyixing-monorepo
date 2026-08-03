import { useQuery } from "@tanstack/react-query";
import type { ProductChannel } from "@ryx/shared-types";

import { getApi } from "@/lib/api";

export function useOrderDetail(orderId: string, pollMs = 3000, channel?: ProductChannel) {
  return useQuery({
    queryKey: ["order", "detail", orderId, channel],
    queryFn: () => getApi().order.getDetail({ OrderId: orderId, channel }),
    enabled: Boolean(orderId),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.isShowPayButton) return false;
      return pollMs;
    },
  });
}
