import { useEffect, useMemo, useRef, useState } from "react";
import type { FlightSearchParams, PassengerBookInfo } from "@ryx/shared-types";

import {
  flightListRouteKey,
  msUntilFlightListTimeout,
  passengerSelectionFingerprint,
} from "@/lib/flight-list-refresh";

interface UseFlightListPageEffectsOptions {
  listParams: FlightSearchParams;
  searchParams: URLSearchParams;
  selectedPassengers: PassengerBookInfo[];
  hasListQuery: boolean;
  dataUpdatedAt: number;
  isFetching: boolean;
  refetch: () => Promise<unknown>;
  onFullRefresh: () => void;
  stripDoRefresh: () => void;
}

export function useFlightListPageEffects({
  listParams,
  searchParams,
  selectedPassengers,
  hasListQuery,
  dataUpdatedAt,
  isFetching,
  refetch,
  onFullRefresh,
  stripDoRefresh,
}: UseFlightListPageEffectsOptions) {
  const [timeoutOpen, setTimeoutOpen] = useState(false);
  const routeKey = useMemo(() => flightListRouteKey(listParams), [listParams]);
  const passengerFingerprint = useMemo(
    () => passengerSelectionFingerprint(selectedPassengers),
    [selectedPassengers],
  );

  const routeKeyRef = useRef(routeKey);
  const passengerRef = useRef<string | null>(null);
  const doRefreshHandledRef = useRef(false);

  useEffect(() => {
    if (!hasListQuery) return;

    if (routeKeyRef.current !== routeKey) {
      routeKeyRef.current = routeKey;
      passengerRef.current = passengerFingerprint;
      doRefreshHandledRef.current = false;
    }

    if (searchParams.get("doRefresh") === "true" && !doRefreshHandledRef.current) {
      doRefreshHandledRef.current = true;
      stripDoRefresh();
      onFullRefresh();
      void refetch();
      passengerRef.current = passengerFingerprint;
      return;
    }

    if (
      passengerRef.current !== null &&
      passengerRef.current !== passengerFingerprint &&
      !isFetching
    ) {
      onFullRefresh();
      void refetch();
    }
    passengerRef.current = passengerFingerprint;
  }, [
    hasListQuery,
    routeKey,
    passengerFingerprint,
    searchParams,
    isFetching,
    refetch,
    onFullRefresh,
    stripDoRefresh,
  ]);

  useEffect(() => {
    if (!hasListQuery || !dataUpdatedAt) return;

    const delay = msUntilFlightListTimeout(dataUpdatedAt);
    const timer = window.setTimeout(() => setTimeoutOpen(true), delay);
    return () => window.clearTimeout(timer);
  }, [hasListQuery, dataUpdatedAt, routeKey]);

  function confirmTimeoutRefresh() {
    setTimeoutOpen(false);
    onFullRefresh();
    void refetch();
  }

  return {
    timeoutOpen,
    confirmTimeoutRefresh,
  };
}
