import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FlightSearchParams, PassengerBookInfo } from "@ryx/shared-types";

import { useFlightPriceTimeout } from "@/hooks/useFlightPriceTimeout";
import { flightListRouteKey, passengerSelectionFingerprint } from "@/lib/flight-list-refresh";

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
  const routeKey = useMemo(() => flightListRouteKey(listParams), [listParams]);
  const passengerFingerprint = useMemo(
    () => passengerSelectionFingerprint(selectedPassengers),
    [selectedPassengers],
  );

  const routeKeyRef = useRef(routeKey);
  const passengerRef = useRef<string | null>(null);
  const doRefreshHandledRef = useRef(false);
  const [priceSnapshotAt, setPriceSnapshotAt] = useState(0);

  const bumpPriceSnapshot = useCallback(() => {
    setPriceSnapshotAt(Date.now());
  }, []);

  useEffect(() => {
    setPriceSnapshotAt(0);
  }, [routeKey]);

  useEffect(() => {
    if (!hasListQuery || !dataUpdatedAt || priceSnapshotAt !== 0) return;
    setPriceSnapshotAt(dataUpdatedAt);
  }, [hasListQuery, dataUpdatedAt, priceSnapshotAt]);

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
      void refetch().then(() => bumpPriceSnapshot());
      passengerRef.current = passengerFingerprint;
      return;
    }

    if (
      passengerRef.current !== null &&
      passengerRef.current !== passengerFingerprint &&
      !isFetching
    ) {
      onFullRefresh();
      void refetch().then(() => bumpPriceSnapshot());
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
    bumpPriceSnapshot,
  ]);

  const handleTimeoutRefresh = useCallback(() => {
    // Reset snapshot before closing the dialog so the timer effect does not
    // immediately reopen it (snapshot would still be past the timeout window).
    bumpPriceSnapshot();
    onFullRefresh();
    void refetch();
  }, [onFullRefresh, refetch, bumpPriceSnapshot]);

  useFlightPriceTimeout({
    enabled: hasListQuery,
    snapshotAt: priceSnapshotAt,
    onRefresh: handleTimeoutRefresh,
  });
}
