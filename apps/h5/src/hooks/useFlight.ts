import { ApiError } from "@ryx/api";
import { useQuery } from "@tanstack/react-query";
import type { FlightDetailParams, FlightSearchParams } from "@ryx/shared-types";

import { FLIGHT_LIST_STALE_MS } from "@/lib/flight-list-refresh";
import { normalizeFlightDetailResponse } from "@ryx/api";
import { getApi } from "@/lib/api";
import { getApiMode } from "@/lib/env";
import { getTicket } from "@/lib/session";

function canQueryFlightList(): boolean {
  return getApiMode() === "mock" || Boolean(getTicket());
}

export function useFlightAirports() {
  return useQuery({
    queryKey: ["flight", "airports"],
    queryFn: () => getApi().flight.getAirports(),
    staleTime: 1000 * 60 * 30,
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
    enabled: Boolean(params?.Date && params?.FromCode && params?.ToCode && canQueryFlightList()),
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
        canQueryFlightList(),
    ),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    retry: (failureCount) => failureCount < 1,
  });
}
