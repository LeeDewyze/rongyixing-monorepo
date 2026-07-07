import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FlightBookParams, FlightInitBookParams } from "@ryx/shared-types";

import {
  FLIGHT_BOOK_SELECTION_EVENT,
  loadFlightBookSelection,
  type FlightBookSelection,
} from "@/lib/flight-book-session";
import { getApi } from "@/lib/api";

export function useFlightBookSelection() {
  const [selection, setSelectionState] = useState<FlightBookSelection | null>(() =>
    loadFlightBookSelection(),
  );

  useEffect(() => {
    function sync() {
      setSelectionState(loadFlightBookSelection());
    }
    window.addEventListener(FLIGHT_BOOK_SELECTION_EVENT, sync);
    return () => window.removeEventListener(FLIGHT_BOOK_SELECTION_EVENT, sync);
  }, []);

  const reload = useCallback(() => {
    setSelectionState(loadFlightBookSelection());
  }, []);

  return { selection, reload };
}

export function useFlightInitBook(params: FlightInitBookParams | null) {
  return useQuery({
    queryKey: ["flight", "initBook", params],
    queryFn: () => getApi().flight.initializeBook(params!),
    enabled: Boolean(params?.Passengers?.length),
    staleTime: 0,
    retry: false,
  });
}

export function useFlightSubmitBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: FlightBookParams) => getApi().flight.submitBook(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order"] });
    },
  });
}

export { useTravelForms } from "@/hooks/useHotelBook";
