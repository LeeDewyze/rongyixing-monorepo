import { useQuery } from "@tanstack/react-query";
import type { FlightSearchParams } from "@ryx/shared-types";

import { getApi } from "@/lib/api";

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
    enabled: Boolean(params?.Date && params?.FromCode && params?.ToCode),
  });
}
