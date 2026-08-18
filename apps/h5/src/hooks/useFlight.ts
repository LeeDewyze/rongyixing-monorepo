import { ApiError } from "@ryx/api";
import { useQuery } from "@tanstack/react-query";
import type {
  FlightDetailParams,
  FlightPolicyParams,
  FlightPolicyPassengerResult,
  FlightSearchParams,
  Trafficline,
} from "@ryx/shared-types";
import { readResourceCache, writeResourceCache } from "@ryx/api";

import { FLIGHT_LIST_STALE_MS } from "@/lib/flight-list-refresh";
import { normalizeFlightDetailResponse } from "@ryx/api";
import { getApi } from "@/lib/api";
import { getApiMode } from "@/lib/env";
import { getTicket } from "@/lib/session";

function canQueryFlightList(params?: { TicketId?: string }): boolean {
  return getApiMode() === "mock" || Boolean(getTicket()) || Boolean(params?.TicketId);
}

const AIRPORT_CACHE_KEY = "ryx:h5:resource:airports:v1";
const RESOURCE_STALE_TIME = 24 * 60 * 60 * 1000;
const RESOURCE_GC_TIME = 7 * 24 * 60 * 60 * 1000;

export function useFlightAirports(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const cached = readResourceCache<Trafficline[]>(AIRPORT_CACHE_KEY);
  return useQuery({
    queryKey: ["flight", "airports"],
    queryFn: async () => {
      const airports = await getApi().flight.getAirports();
      writeResourceCache(AIRPORT_CACHE_KEY, airports);
      return airports;
    },
    initialData: cached?.data,
    initialDataUpdatedAt: cached?.updatedAt,
    staleTime: RESOURCE_STALE_TIME,
    gcTime: RESOURCE_GC_TIME,
    enabled,
  });
}

export function useFlightList(params: FlightSearchParams | null) {
  return useQuery({
    queryKey: ["flight", "list", params],
    queryFn: async () => {
      const api = getApi();
      if (getApiMode() !== "mock" && !api.proxy.getApiConfig()?.Token) {
        await api.proxy.loadApiConfig();
      }
      return api.flight.searchFlights(params!);
    },
    enabled: Boolean(
      params?.Date && params?.FromCode && params?.ToCode && canQueryFlightList(params),
    ),
    staleTime: FLIGHT_LIST_STALE_MS,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (failureCount >= 2) return false;
      if (error instanceof ApiError && error.message.includes("没有获取列表")) {
        return true;
      }
      return failureCount < 1;
    },
  });
}

export function useFlightDetail(params: FlightDetailParams | null) {
  return useQuery({
    queryKey: ["flight", "detail", params],
    queryFn: async () => {
      const api = getApi();
      if (getApiMode() !== "mock" && !api.proxy.getApiConfig()?.Token) {
        await api.proxy.loadApiConfig();
      }
      return normalizeFlightDetailResponse(await api.flight.getFlightDetail(params!));
    },
    enabled: Boolean(
      params?.Date &&
        params?.FromCode &&
        params?.ToCode &&
        params?.FlightNumber &&
        canQueryFlightList(params),
    ),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    retry: (failureCount) => failureCount < 1,
  });
}

export function useFlightPolicy(
  params: FlightPolicyParams | null,
  options?: {
    enabled?: boolean;
    initialData?: FlightPolicyPassengerResult[];
  },
) {
  const enabled = options?.enabled ?? true;
  return useQuery({
    queryKey: ["flight", "policy", params],
    queryFn: async () => {
      const api = getApi();
      if (getApiMode() !== "mock" && !api.proxy.getApiConfig()?.Token) {
        await api.proxy.loadApiConfig();
      }
      return api.flight.getFlightPolicy(params!);
    },
    enabled: enabled && Boolean(params?.Passengers && params.FlightDetail),
    initialData: options?.initialData,
    staleTime: FLIGHT_LIST_STALE_MS,
    refetchOnWindowFocus: false,
    retry: (failureCount) => failureCount < 1,
  });
}
