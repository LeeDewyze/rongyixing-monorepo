import { useCallback, useEffect, useRef } from "react";

import { isFlightListTimedOut, msUntilFlightListTimeout } from "@/lib/flight-list-refresh";
import { requestFlightListTimeoutDialog } from "@/lib/flight-list-timeout-dialog";

interface UseFlightPriceTimeoutOptions {
  enabled: boolean;
  snapshotAt: number;
  onRefresh: () => void;
}

/**
 * Legacy `pagePopTimeout` — show stale-price dialog after 10 minutes on list/detail.
 * Uses a stable snapshot timestamp that is not reset by background refetches.
 * Dialog UI is a singleton via `FlightListTimeoutDialogHost`.
 */
export function useFlightPriceTimeout({
  enabled,
  snapshotAt,
  onRefresh,
}: UseFlightPriceTimeoutOptions) {
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  const tryOpenDialog = useCallback(() => {
    if (!enabled || !snapshotAt) return;
    requestFlightListTimeoutDialog(() => onRefreshRef.current());
  }, [enabled, snapshotAt]);

  const checkTimedOut = useCallback(() => {
    if (!enabled || !snapshotAt) return;
    if (isFlightListTimedOut(snapshotAt)) {
      tryOpenDialog();
    }
  }, [enabled, snapshotAt, tryOpenDialog]);

  useEffect(() => {
    if (!enabled || !snapshotAt) return;
    checkTimedOut();
  }, [enabled, snapshotAt, checkTimedOut]);

  useEffect(() => {
    if (!enabled || !snapshotAt) return;

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        checkTimedOut();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [enabled, snapshotAt, checkTimedOut]);

  useEffect(() => {
    if (!enabled || !snapshotAt) return;
    if (isFlightListTimedOut(snapshotAt)) return;

    const delay = msUntilFlightListTimeout(snapshotAt);
    const timer = window.setTimeout(() => tryOpenDialog(), delay);
    return () => window.clearTimeout(timer);
  }, [enabled, snapshotAt, tryOpenDialog]);

  const openTimeoutDialog = useCallback(() => {
    tryOpenDialog();
  }, [tryOpenDialog]);

  return {
    openTimeoutDialog,
  };
}
