import { useQuery } from "@tanstack/react-query";
import type { FlightCityOption } from "@/lib/city-list";

import { readResourceCache, writeResourceCache } from "@ryx/api";
import { getApi } from "@/lib/api";
import { mapTrafficlinesToCityOptions } from "@/lib/city-list";

const AIRPORT_CACHE_KEY = "ryx:web:resource:airports:v1";
const RESOURCE_STALE_TIME = 24 * 60 * 60 * 1000;
const RESOURCE_GC_TIME = 7 * 24 * 60 * 60 * 1000;

export function useFlightAirports() {
  const cached = readResourceCache<FlightCityOption[]>(AIRPORT_CACHE_KEY);
  return useQuery({
    queryKey: ["flight", "airports"],
    queryFn: async () => {
      const lines = await getApi().flight.getDomesticAirports({ LastUpdateTime: 0 });
      const airports = mapTrafficlinesToCityOptions(lines);
      writeResourceCache(AIRPORT_CACHE_KEY, airports);
      return airports;
    },
    initialData: cached?.data,
    initialDataUpdatedAt: cached?.updatedAt,
    staleTime: RESOURCE_STALE_TIME,
    gcTime: RESOURCE_GC_TIME,
  });
}
