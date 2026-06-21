import { useQuery } from "@tanstack/react-query";

import { getApi } from "@/lib/api";
import { mapTrafficlinesToCityOptions } from "@/lib/city-list";

export function useFlightAirports() {
  return useQuery({
    queryKey: ["flight", "airports"],
    queryFn: async () => {
      const lines = await getApi().flight.getDomesticAirports({ LastUpdateTime: 0 });
      return mapTrafficlinesToCityOptions(lines);
    },
  });
}
