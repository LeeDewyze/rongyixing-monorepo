import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

const PULL_THRESHOLD = 64;
const PULL_START_THRESHOLD = 8;
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
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const pullStartedRef = useRef(false);
  const pullingRef = useRef(false);
  const pullDistanceRef = useRef(0);

  const resetPull = useCallback(() => {
    pullingRef.current = false;
    pullStartedRef.current = false;
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
      startXRef.current = event.touches[0]?.clientX ?? 0;
      startYRef.current = event.touches[0]?.clientY ?? 0;
      pullStartedRef.current = false;
      pullingRef.current = true;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!pullingRef.current || isRefreshing || element.scrollTop > 0) {
        if (element.scrollTop > 0) {
          resetPull();
        }
        return;
      }

      const currentX = event.touches[0]?.clientX ?? startXRef.current;
      const currentY = event.touches[0]?.clientY ?? startYRef.current;
      const deltaX = currentX - startXRef.current;
      const deltaY = currentY - startYRef.current;
      if (Math.abs(deltaX) > Math.abs(deltaY) || deltaY <= 0) {
        resetPull();
        return;
      }
      if (!pullStartedRef.current) {
        if (deltaY < PULL_START_THRESHOLD) {
          return;
        }
        pullStartedRef.current = true;
      }

      event.preventDefault();
      const nextDistance = Math.min(deltaY * 0.45, MAX_PULL);
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
