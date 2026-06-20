import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useCallback, useSyncExternalStore } from "react";
import type { PassengerBookInfo, ProductType } from "@ryx/shared-types";

import { getApi } from "@/lib/api";
import {
  loadPassengerSelection,
  PASSENGER_SELECTION_EVENT,
  passengerSelectionKey,
  savePassengerSelection,
} from "@/lib/passenger-selection";

const PAGE_SIZE = 20;
const EMPTY_PASSENGERS: PassengerBookInfo[] = [];

/** Cached snapshots so useSyncExternalStore getSnapshot stays referentially stable. */
const selectionSnapshotCache = new Map<
  ProductType,
  { raw: string | null; snapshot: PassengerBookInfo[] }
>();

function getPassengerSelectionSnapshot(forType: ProductType): PassengerBookInfo[] {
  const key = passengerSelectionKey(forType);
  const raw = localStorage.getItem(key);
  const cached = selectionSnapshotCache.get(forType);
  if (cached && cached.raw === raw) {
    return cached.snapshot;
  }

  const snapshot = raw ? loadPassengerSelection(forType) : EMPTY_PASSENGERS;
  selectionSnapshotCache.set(forType, { raw, snapshot });
  return snapshot;
}

function subscribeSelection(key: string, onStoreChange: () => void) {
  const onCustom = (e: Event) => {
    const detail = (e as CustomEvent<{ key: string }>).detail;
    if (detail?.key === key) onStoreChange();
  };
  const onStorage = (e: StorageEvent) => {
    if (e.key === key) onStoreChange();
  };
  window.addEventListener(PASSENGER_SELECTION_EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(PASSENGER_SELECTION_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}

export function useStaffList(keyword: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: ["passenger", "staff", keyword],
    queryFn: ({ pageParam = 0 }) =>
      getApi().passenger.getStaffList({
        Name: keyword,
        Mobile: keyword,
        PageIndex: pageParam,
        PageSize: PAGE_SIZE,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, pageParam) => {
      const loaded = (pageParam + 1) * PAGE_SIZE;
      const total = lastPage.TotalCount ?? lastPage.Staffs.length;
      return loaded < total ? pageParam + 1 : undefined;
    },
    enabled,
  });
}

export function useExternalPassengerList(keyword: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: ["passenger", "external", keyword],
    queryFn: ({ pageParam = 0 }) =>
      getApi().passenger.getPassengerList({
        Name: keyword,
        PageIndex: pageParam,
        PageSize: PAGE_SIZE,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, pageParam) => {
      const loaded = (pageParam + 1) * PAGE_SIZE;
      const total = lastPage.TotalCount ?? lastPage.Passengers.length;
      return loaded < total ? pageParam + 1 : undefined;
    },
    enabled,
  });
}

/** Reactive selected passengers persisted per product type. */
export function usePassengerSelection(forType: ProductType) {
  const key = passengerSelectionKey(forType);

  const selected = useSyncExternalStore(
    (onStoreChange) => subscribeSelection(key, onStoreChange),
    () => getPassengerSelectionSnapshot(forType),
    () => getPassengerSelectionSnapshot(forType),
  );

  const setSelected = useCallback(
    (items: typeof selected) => {
      savePassengerSelection(forType, items);
    },
    [forType],
  );

  return { selected, setSelected };
}

export function useAllowExternalPassengers() {
  return useQuery({
    queryKey: ["passenger", "allowExternal"],
    queryFn: async () => true,
    staleTime: Infinity,
  });
}
