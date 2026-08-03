import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { OrderDetailProductType, PayCreateParams, ProductChannel } from "@ryx/shared-types";

import { getApi } from "@/lib/api";
import { resolvePayHoldSeconds } from "@/lib/order-pay";

export function usePayTotalAmount(
  orderId: string,
  options: { channel?: ProductChannel; productType?: OrderDetailProductType } = {},
) {
  return useQuery({
    queryKey: ["pay", "total", orderId, options.channel, options.productType],
    queryFn: () =>
      getApi().pay.getTotalPayAmount({
        OrderId: orderId,
        channel: options.channel,
        ProductType: options.productType,
      }),
    enabled: Boolean(orderId),
  });
}

export function useOrderPays(
  orderId: string,
  options: { channel?: ProductChannel; productType?: OrderDetailProductType } = {},
) {
  return useQuery({
    queryKey: ["pay", "channels", orderId, options.channel, options.productType],
    queryFn: () =>
      getApi().pay.getOrderPays({
        OrderId: orderId,
        channel: options.channel,
      }),
    enabled: Boolean(orderId),
  });
}

export function usePayCreate() {
  return useMutation({
    mutationFn: (params: PayCreateParams) => getApi().pay.create(params),
  });
}

export function usePayProcess() {
  return useMutation({
    mutationFn: (params: {
      OutTradeNo: string;
      Type: string;
      channel?: ProductChannel;
      ProductType?: OrderDetailProductType;
    }) => getApi().pay.process(params),
  });
}

export function usePayHoldCountdown(payHoldTime?: number) {
  const initialSeconds = resolvePayHoldSeconds(payHoldTime);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(initialSeconds);

  useEffect(() => {
    setRemainingSeconds(resolvePayHoldSeconds(payHoldTime));
  }, [payHoldTime]);

  useEffect(() => {
    if (remainingSeconds == null || remainingSeconds <= 0) return undefined;
    const timer = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current == null || current <= 1) return 0;
        return Math.max(0, Math.floor(current) - 1);
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [remainingSeconds]);

  return remainingSeconds;
}
