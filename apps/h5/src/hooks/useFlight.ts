import { useQuery } from "@tanstack/react-query";
import type { FlightSearchParams } from "@ryx/shared-types";

import { FLIGHT_LIST_STALE_MS } from "@/lib/flight-list-refresh";
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
    queryFn: () => getApi().flight.searchFlights(params!),
    enabled: Boolean(params?.Date && params?.FromCode && params?.ToCode && canQueryFlightList()),
    staleTime: FLIGHT_LIST_STALE_MS,
    refetchOnWindowFocus: false,
  });
}
