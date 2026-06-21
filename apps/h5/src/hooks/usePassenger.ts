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

function nextPageParam(
  items: unknown[] | undefined,
  totalCount: number | undefined,
  pageParam: number,
): number | undefined {
  const pageItems = items ?? [];
  if (totalCount != null) {
    const loaded = (pageParam + 1) * PAGE_SIZE;
    return loaded < totalCount ? pageParam + 1 : undefined;
  }
  // Legacy API: no TotalCount — infer from page size
  return pageItems.length >= PAGE_SIZE ? pageParam + 1 : undefined;
}

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
    getNextPageParam: (lastPage, _pages, pageParam) =>
      nextPageParam(lastPage?.Staffs, lastPage?.TotalCount, pageParam),
    enabled,
  });
}

export function useExternalPassengerList(keyword: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: ["passenger", "external", keyword],
    queryFn: ({ pageParam = 0 }) =>
      getApi().passenger.getPassengerList({
        Name: keyword,
        Mobile: keyword,
        PageIndex: pageParam,
        PageSize: PAGE_SIZE,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, pageParam) =>
      nextPageParam(lastPage?.Passengers, lastPage?.TotalCount, pageParam),
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
    queryFn: async () => {
      try {
        const tmc = await getApi().tmc.getTmc();
        return tmc.AllowAddingNonTmcUser !== false;
      } catch {
        return true;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}
