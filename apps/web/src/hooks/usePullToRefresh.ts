import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

const PULL_THRESHOLD = 64;
const MAX_PULL = 96;
const REFRESH_HOLD = 48;

interface UsePullToRefreshOptions {
  scrollRef: RefObject<HTMLElement | null>;
  /** Pass the mounted scroll element so listeners attach after ref is set. */
  scrollElement?: HTMLElement | null;
  onRefresh: () => Promise<unknown>;
  disabled?: boolean;
}

export function usePullToRefresh({
  scrollRef,
  scrollElement,
  onRefresh,
  disabled = false,
}: UsePullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(0);
  const pullingRef = useRef(false);
  const pullDistanceRef = useRef(0);

  const resetPull = useCallback(() => {
    pullingRef.current = false;
    pullDistanceRef.current = 0;
    setPullDistance(0);
  }, []);

  const triggerRefresh = useCallback(async () => {
    setIsRefreshing(true);
    pullDistanceRef.current = REFRESH_HOLD;
    setPullDistance(REFRESH_HOLD);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
      resetPull();
    }
  }, [onRefresh, resetPull]);

  useEffect(() => {
    const element = scrollElement ?? scrollRef.current;
    if (!element || disabled) {
      return;
    }

    const handleTouchStart = (event: TouchEvent) => {
      if (isRefreshing || element.scrollTop > 0) {
        return;
      }
      startYRef.current = event.touches[0]?.clientY ?? 0;
      pullingRef.current = true;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!pullingRef.current || isRefreshing || element.scrollTop > 0) {
        if (element.scrollTop > 0) {
          resetPull();
        }
        return;
      }

      const currentY = event.touches[0]?.clientY ?? startYRef.current;
      const delta = currentY - startYRef.current;
      if (delta <= 0) {
        resetPull();
        return;
      }

      event.preventDefault();
      const nextDistance = Math.min(delta * 0.45, MAX_PULL);
      pullDistanceRef.current = nextDistance;
      setPullDistance(nextDistance);
    };

    const handleTouchEnd = () => {
      if (!pullingRef.current || isRefreshing) {
        return;
      }

      pullingRef.current = false;
      if (pullDistanceRef.current >= PULL_THRESHOLD) {
        void triggerRefresh();
        return;
      }
      resetPull();
    };

    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchmove", handleTouchMove, { passive: false });
    element.addEventListener("touchend", handleTouchEnd, { passive: true });
    element.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
      element.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [disabled, isRefreshing, resetPull, scrollElement, scrollRef, triggerRefresh]);

  const statusLabel = isRefreshing
    ? "刷新中…"
    : pullDistance >= PULL_THRESHOLD
      ? "释放刷新"
      : pullDistance > 0
        ? "下拉刷新"
        : "";

  return {
    pullDistance,
    isRefreshing,
    statusLabel,
    isActive: pullDistance > 0 || isRefreshing,
  };
}
